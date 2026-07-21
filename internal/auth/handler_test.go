package auth

import (
	"strings"
	"testing"
	"time"

	"apex/internal/config"
	"apex/internal/models"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" // 32 chars

func testUser() models.User {
	return models.User{
		ID:    42,
		Email: "alice@example.com",
		Role:  "student",
		Name:  "Alice",
	}
}

func TestGenerateTokenClaims(t *testing.T) {
	Init(config.Config{JWTSecret: testSecret})

	user := testUser()
	before := time.Now()
	tokenStr, err := generateToken(user)
	if err != nil {
		t.Fatalf("generateToken returned error: %v", err)
	}
	if tokenStr == "" {
		t.Fatal("generateToken returned an empty token")
	}

	parsed, err := jwt.Parse(tokenStr, func(tok *jwt.Token) (any, error) {
		if _, ok := tok.Method.(*jwt.SigningMethodHMAC); !ok {
			t.Errorf("unexpected signing method: %v", tok.Header["alg"])
		}
		return []byte(testSecret), nil
	})
	if err != nil {
		t.Fatalf("failed to parse/validate token: %v", err)
	}
	if !parsed.Valid {
		t.Fatal("parsed token reported invalid")
	}

	// Algorithm must be HS256.
	if alg, _ := parsed.Header["alg"].(string); alg != "HS256" {
		t.Errorf("alg header = %q, want HS256", alg)
	}

	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		t.Fatalf("claims type = %T, want jwt.MapClaims", parsed.Claims)
	}

	// JSON numbers decode to float64.
	if got, _ := claims["user_id"].(float64); got != float64(user.ID) {
		t.Errorf("user_id claim = %v, want %d", claims["user_id"], user.ID)
	}
	if got, _ := claims["email"].(string); got != user.Email {
		t.Errorf("email claim = %q, want %q", got, user.Email)
	}
	if got, _ := claims["role"].(string); got != user.Role {
		t.Errorf("role claim = %q, want %q", got, user.Role)
	}
	if got, _ := claims["name"].(string); got != user.Name {
		t.Errorf("name claim = %q, want %q", got, user.Name)
	}

	// exp should be ~24h in the future.
	expF, ok := claims["exp"].(float64)
	if !ok {
		t.Fatalf("exp claim missing or wrong type: %v", claims["exp"])
	}
	exp := time.Unix(int64(expF), 0)
	wantMin := before.Add(24*time.Hour - time.Minute)
	wantMax := before.Add(24*time.Hour + time.Minute)
	if exp.Before(wantMin) || exp.After(wantMax) {
		t.Errorf("exp = %v, want within one minute of %v", exp, before.Add(24*time.Hour))
	}
}

func TestGenerateTokenWrongSecretFailsValidation(t *testing.T) {
	Init(config.Config{JWTSecret: testSecret})

	tokenStr, err := generateToken(testUser())
	if err != nil {
		t.Fatalf("generateToken returned error: %v", err)
	}

	_, err = jwt.Parse(tokenStr, func(*jwt.Token) (any, error) {
		return []byte(strings.Repeat("y", 32)), nil
	})
	if err == nil {
		t.Fatal("expected validation to fail with a different secret, got nil error")
	}
}

func TestHashToken(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string // known SHA-256 hex, empty if only length/format checked
	}{
		{
			name:  "empty string known answer",
			input: "",
			want:  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		},
		{
			name:  "abc known answer",
			input: "abc",
			want:  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := hashToken(tt.input)
			if got != tt.want {
				t.Errorf("hashToken(%q) = %q, want %q", tt.input, got, tt.want)
			}
			if len(got) != 64 {
				t.Errorf("hashToken(%q) length = %d, want 64", tt.input, len(got))
			}
		})
	}
}

func TestHashTokenDeterministicAndLowercaseHex(t *testing.T) {
	const in = "reset-token-abc123"
	first := hashToken(in)
	second := hashToken(in)
	if first != second {
		t.Errorf("hashToken not deterministic: %q vs %q", first, second)
	}
	if len(first) != 64 {
		t.Errorf("length = %d, want 64", len(first))
	}
	if strings.ToLower(first) != first {
		t.Errorf("output not lowercase: %q", first)
	}
	for _, r := range first {
		if !strings.ContainsRune("0123456789abcdef", r) {
			t.Errorf("non-hex character %q in output %q", r, first)
		}
	}
}

func TestHashTokenDistinctInputs(t *testing.T) {
	a := hashToken("token-one")
	b := hashToken("token-two")
	if a == b {
		t.Errorf("distinct inputs produced identical hash %q", a)
	}
}

func TestEmailRegex(t *testing.T) {
	tests := []struct {
		email string
		want  bool
	}{
		{"a@b.co", true},
		{"first.last@sub.example.com", true},
		{"user+tag@domain.io", true},
		// rejections
		{"", false},
		{"ab.co", false},   // no '@'
		{"a@b", false},     // no dot after domain
		{"a b@c.d", false}, // space in local part
		{"a@b c.d", false}, // space in domain
		{"@b.co", false},   // leading '@' (empty local)
		{"a@b.co@", false}, // trailing '@'
		{"a@@b.co", false}, // double '@'
		{"a@.co", false},   // empty segment before the dot; [^\s@]+ needs >=1 char
	}
	for _, tt := range tests {
		t.Run(tt.email, func(t *testing.T) {
			if got := emailRegex.MatchString(tt.email); got != tt.want {
				t.Errorf("emailRegex.MatchString(%q) = %v, want %v", tt.email, got, tt.want)
			}
		})
	}
}
