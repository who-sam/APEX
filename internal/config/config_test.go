package config

import (
	"net/url"
	"strings"
	"testing"
)

func TestConfigDSN(t *testing.T) {
	tests := []struct {
		name string
		cfg  Config
		want string
	}{
		{
			name: "DatabaseURL set is returned verbatim",
			cfg: Config{
				DatabaseURL: "postgres://u:p@example.com:5432/db?sslmode=require",
				// Discrete fields must be ignored when DatabaseURL is present.
				DBHost:     "ignored",
				DBPort:     "1111",
				DBUser:     "ignored",
				DBPassword: "ignored",
				DBName:     "ignored",
				DBSSLMode:  "ignored",
			},
			want: "postgres://u:p@example.com:5432/db?sslmode=require",
		},
		{
			name: "empty password omits password segment",
			cfg: Config{
				DBHost:     "localhost",
				DBPort:     "5432",
				DBUser:     "postgres",
				DBPassword: "",
				DBName:     "apex",
				DBSSLMode:  "disable",
			},
			want: "host=localhost port=5432 user=postgres dbname=apex sslmode=disable",
		},
		{
			name: "password set appends password segment at end",
			cfg: Config{
				DBHost:     "db.internal",
				DBPort:     "6543",
				DBUser:     "apexuser",
				DBPassword: "s3cr3t",
				DBName:     "apexdb",
				DBSSLMode:  "require",
			},
			want: "host=db.internal port=6543 user=apexuser dbname=apexdb sslmode=require password=s3cr3t",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.cfg.DSN()
			if got != tt.want {
				t.Fatalf("DSN() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestConfigDSNOmitsPasswordSubstring(t *testing.T) {
	cfg := Config{
		DBHost:    "localhost",
		DBPort:    "5432",
		DBUser:    "postgres",
		DBName:    "apex",
		DBSSLMode: "disable",
	}
	dsn := cfg.DSN()
	if strings.Contains(dsn, "password=") {
		t.Fatalf("DSN() = %q, must not contain any password= segment when password is empty", dsn)
	}
}

func TestConfigDSNFieldOrderStable(t *testing.T) {
	cfg := Config{
		DBHost:     "h",
		DBPort:     "p",
		DBUser:     "u",
		DBPassword: "pw",
		DBName:     "d",
		DBSSLMode:  "s",
	}
	dsn := cfg.DSN()
	// host must precede port precede user precede dbname precede sslmode precede password.
	keys := []string{"host=", "port=", "user=", "dbname=", "sslmode=", "password="}
	prev := -1
	for _, k := range keys {
		idx := strings.Index(dsn, k)
		if idx < 0 {
			t.Fatalf("DSN() = %q missing key %q", dsn, k)
		}
		if idx <= prev {
			t.Fatalf("DSN() = %q key %q out of expected order", dsn, k)
		}
		prev = idx
	}
}

func TestConfigMigrateURL(t *testing.T) {
	t.Run("DatabaseURL set is returned verbatim", func(t *testing.T) {
		cfg := Config{
			DatabaseURL: "postgres://u:p@host:5432/db?sslmode=require",
			DBHost:      "ignored",
		}
		if got := cfg.MigrateURL(); got != cfg.DatabaseURL {
			t.Fatalf("MigrateURL() = %q, want %q", got, cfg.DatabaseURL)
		}
	})

	t.Run("discrete vars build a well-formed postgres URL", func(t *testing.T) {
		cfg := Config{
			DBHost:     "db.internal",
			DBPort:     "6543",
			DBUser:     "apexuser",
			DBPassword: "s3cr3t",
			DBName:     "apexdb",
			DBSSLMode:  "require",
		}
		raw := cfg.MigrateURL()
		u, err := url.Parse(raw)
		if err != nil {
			t.Fatalf("MigrateURL() = %q does not parse: %v", raw, err)
		}
		if u.Scheme != "postgres" {
			t.Errorf("scheme = %q, want postgres", u.Scheme)
		}
		if u.Hostname() != "db.internal" {
			t.Errorf("host = %q, want db.internal", u.Hostname())
		}
		if u.Port() != "6543" {
			t.Errorf("port = %q, want 6543", u.Port())
		}
		if u.User.Username() != "apexuser" {
			t.Errorf("username = %q, want apexuser", u.User.Username())
		}
		if pw, _ := u.User.Password(); pw != "s3cr3t" {
			t.Errorf("password = %q, want s3cr3t", pw)
		}
		if u.Path != "/apexdb" {
			t.Errorf("path = %q, want /apexdb", u.Path)
		}
		if got := u.Query().Get("sslmode"); got != "require" {
			t.Errorf("sslmode = %q, want require", got)
		}
	})

	t.Run("sslmode disable is reflected", func(t *testing.T) {
		cfg := Config{
			DBHost:    "h",
			DBPort:    "5432",
			DBUser:    "u",
			DBName:    "d",
			DBSSLMode: "disable",
		}
		u, err := url.Parse(cfg.MigrateURL())
		if err != nil {
			t.Fatalf("parse failed: %v", err)
		}
		if got := u.Query().Get("sslmode"); got != "disable" {
			t.Errorf("sslmode = %q, want disable", got)
		}
	})

	t.Run("special characters in password are percent-encoded and round-trip", func(t *testing.T) {
		const pw = "p@ss:w/o rd"
		cfg := Config{
			DBHost:     "db.internal",
			DBPort:     "5432",
			DBUser:     "apexuser",
			DBPassword: pw,
			DBName:     "apexdb",
			DBSSLMode:  "require",
		}
		raw := cfg.MigrateURL()
		u, err := url.Parse(raw)
		if err != nil {
			t.Fatalf("MigrateURL() = %q does not parse: %v", raw, err)
		}
		// Host must not be corrupted by the '@' in the password.
		if u.Hostname() != "db.internal" {
			t.Fatalf("host corrupted by special-char password: got %q from %q", u.Hostname(), raw)
		}
		gotPw, ok := u.User.Password()
		if !ok || gotPw != pw {
			t.Fatalf("password round-trip failed: got %q (ok=%v), want %q", gotPw, ok, pw)
		}
	})
}

func TestGetEnv(t *testing.T) {
	const key = "APEX_CONFIG_TEST_KEY"

	t.Run("unset key returns fallback", func(t *testing.T) {
		// Ensure isolation: the key is not set in this subtest.
		if got := getEnv(key, "fallback-val"); got != "fallback-val" {
			t.Fatalf("getEnv unset = %q, want fallback-val", got)
		}
	})

	t.Run("set non-empty returns value", func(t *testing.T) {
		t.Setenv(key, "real-value")
		if got := getEnv(key, "fallback-val"); got != "real-value" {
			t.Fatalf("getEnv set = %q, want real-value", got)
		}
	})

	t.Run("empty string is treated as unset and returns fallback", func(t *testing.T) {
		t.Setenv(key, "")
		if got := getEnv(key, "fallback-val"); got != "fallback-val" {
			t.Fatalf("getEnv empty = %q, want fallback-val", got)
		}
	})
}
