package middleware

import (
	"crypto/rand"
	"crypto/rsa"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func generateRSAKey() (*rsa.PrivateKey, error) {
	return rsa.GenerateKey(rand.Reader, 2048)
}

const testSecret = "super-secret-test-key"

func init() {
	gin.SetMode(gin.TestMode)
}

// signHMAC builds a signed token with the given method, secret and claims.
func signHMAC(t *testing.T, method jwt.SigningMethod, secret string, claims jwt.MapClaims) string {
	t.Helper()
	tok := jwt.NewWithClaims(method, claims)
	s, err := tok.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return s
}

// validClaims mirrors the shape produced by auth.generateToken.
func validClaims() jwt.MapClaims {
	return jwt.MapClaims{
		"user_id": float64(42),
		"email":   "amr@example.com",
		"role":    "teacher",
		"name":    "Amr",
		"exp":     time.Now().Add(1 * time.Hour).Unix(),
	}
}

// runAuth executes the Auth middleware for a request carrying the given
// Authorization header value ("" means no header set). It returns the
// recorder plus a flag indicating whether the downstream handler ran and
// the gin context (to inspect keys set by the middleware).
func runAuth(secret, authHeader string) (*httptest.ResponseRecorder, bool, *gin.Context) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	c.Request = req

	nextCalled := false
	handlers := []gin.HandlerFunc{
		Auth(secret),
		func(c *gin.Context) { nextCalled = true },
	}
	for _, h := range handlers {
		h(c)
		if c.IsAborted() {
			break
		}
	}
	return w, nextCalled, c
}

func TestAuth_ValidToken_SetsContextAndProceeds(t *testing.T) {
	tokenStr := signHMAC(t, jwt.SigningMethodHS256, testSecret, validClaims())

	w, nextCalled, c := runAuth(testSecret, "Bearer "+tokenStr)

	if !nextCalled {
		t.Fatalf("expected downstream handler to run, but request was aborted with status %d", w.Code)
	}
	if c.IsAborted() {
		t.Fatalf("context unexpectedly aborted")
	}

	uid, ok := c.Get("user_id")
	if !ok {
		t.Fatalf("user_id not set in context")
	}
	if uid != uint(42) {
		t.Errorf("user_id = %v (%T), want uint(42)", uid, uid)
	}
	if email, _ := c.Get("email"); email != "amr@example.com" {
		t.Errorf("email = %v, want amr@example.com", email)
	}
	if role, _ := c.Get("role"); role != "teacher" {
		t.Errorf("role = %v, want teacher", role)
	}
}

func TestAuth_RejectsBadRequests(t *testing.T) {
	// Tokens built once for reuse across cases.
	wrongSecretTok := signHMAC(t, jwt.SigningMethodHS256, "a-different-secret", validClaims())

	expiredClaims := validClaims()
	expiredClaims["exp"] = time.Now().Add(-1 * time.Hour).Unix()
	expiredTok := signHMAC(t, jwt.SigningMethodHS256, testSecret, expiredClaims)

	noUserID := validClaims()
	delete(noUserID, "user_id")
	noUserIDTok := signHMAC(t, jwt.SigningMethodHS256, testSecret, noUserID)

	noEmail := validClaims()
	delete(noEmail, "email")
	noEmailTok := signHMAC(t, jwt.SigningMethodHS256, testSecret, noEmail)

	noRole := validClaims()
	delete(noRole, "role")
	noRoleTok := signHMAC(t, jwt.SigningMethodHS256, testSecret, noRole)

	// user_id present but as a string, not float64 -> assertion fails.
	badUserIDType := validClaims()
	badUserIDType["user_id"] = "42"
	badUserIDTypeTok := signHMAC(t, jwt.SigningMethodHS256, testSecret, badUserIDType)

	// "none" alg: unsigned token. Must be rejected by the signing-method pin.
	noneTok, err := jwt.NewWithClaims(jwt.SigningMethodNone, validClaims()).
		SignedString(jwt.UnsafeAllowNoneSignatureType)
	if err != nil {
		t.Fatalf("failed to build none-alg token: %v", err)
	}

	tests := []struct {
		name   string
		header string
	}{
		{"no header", ""},
		{"empty bearer prefix only", "Bearer "},
		{"missing bearer prefix", signHMAC(t, jwt.SigningMethodHS256, testSecret, validClaims())},
		{"wrong scheme", "Basic " + signHMAC(t, jwt.SigningMethodHS256, testSecret, validClaims())},
		{"garbage token", "Bearer not-a-jwt"},
		{"wrong secret", "Bearer " + wrongSecretTok},
		{"expired token", "Bearer " + expiredTok},
		{"none alg (security)", "Bearer " + noneTok},
		{"missing user_id claim", "Bearer " + noUserIDTok},
		{"missing email claim", "Bearer " + noEmailTok},
		{"missing role claim", "Bearer " + noRoleTok},
		{"user_id wrong type", "Bearer " + badUserIDTypeTok},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			w, nextCalled, c := runAuth(testSecret, tc.header)
			if nextCalled {
				t.Fatalf("downstream handler ran, but request should have been rejected")
			}
			if !c.IsAborted() {
				t.Fatalf("context was not aborted")
			}
			if w.Code != http.StatusUnauthorized {
				t.Errorf("status = %d, want %d", w.Code, http.StatusUnauthorized)
			}
		})
	}
}

func TestAuth_RejectsRS256Token(t *testing.T) {
	// An RS256 token whose method is not *SigningMethodHMAC must be rejected
	// by the keyfunc regardless of signature validity.
	claims := validClaims()
	tok := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	// We cannot easily sign RS256 without a key, but the middleware rejects
	// based on the header alg before verifying the signature. Construct the
	// token string manually via a dummy signed HMAC then swap is overkill;
	// instead assert the keyfunc path using a real (throwaway) RSA key.
	key, err := generateRSAKey()
	if err != nil {
		t.Skipf("cannot generate RSA key: %v", err)
	}
	signed, err := tok.SignedString(key)
	if err != nil {
		t.Fatalf("failed to sign RS256 token: %v", err)
	}

	w, nextCalled, c := runAuth(testSecret, "Bearer "+signed)
	if nextCalled {
		t.Fatalf("downstream handler ran on RS256 token; signing-method pin bypassed")
	}
	if !c.IsAborted() || w.Code != http.StatusUnauthorized {
		t.Errorf("RS256 token not rejected: aborted=%v status=%d", c.IsAborted(), w.Code)
	}
}

// runRole executes an optional preset (to seed the "role" key) followed by
// the RequireRole middleware. seedRole=="" means the role key is never set.
func runRole(seedRole string, seedSet bool, roles ...string) (*httptest.ResponseRecorder, bool) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)

	nextCalled := false
	handlers := []gin.HandlerFunc{
		func(c *gin.Context) {
			if seedSet {
				c.Set("role", seedRole)
			}
		},
		RequireRole(roles...),
		func(c *gin.Context) { nextCalled = true },
	}
	for _, h := range handlers {
		h(c)
		if c.IsAborted() {
			break
		}
	}
	return w, nextCalled
}

func TestRequireRole(t *testing.T) {
	tests := []struct {
		name       string
		seedSet    bool
		seedRole   string
		allowed    []string
		wantNext   bool
		wantStatus int
	}{
		{"allowed role proceeds", true, "admin", []string{"admin", "teacher"}, true, http.StatusOK},
		{"second allowed role proceeds", true, "teacher", []string{"admin", "teacher"}, true, http.StatusOK},
		{"disallowed role forbidden", true, "student", []string{"admin", "teacher"}, false, http.StatusForbidden},
		{"no role in context unauthorized", false, "", []string{"admin"}, false, http.StatusUnauthorized},
		{"empty allowed list forbids everyone", true, "admin", nil, false, http.StatusForbidden},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			w, nextCalled := runRole(tc.seedRole, tc.seedSet, tc.allowed...)
			if nextCalled != tc.wantNext {
				t.Fatalf("nextCalled = %v, want %v (status %d)", nextCalled, tc.wantNext, w.Code)
			}
			if tc.wantNext {
				return // recorder stays at default 200 when Next runs
			}
			if w.Code != tc.wantStatus {
				t.Errorf("status = %d, want %d", w.Code, tc.wantStatus)
			}
		})
	}
}
