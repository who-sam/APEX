package config

import (
	"log"
	"net/url"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

func init() {
	_ = godotenv.Load()
}

type Config struct {
	DatabaseURL string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	DBSSLMode   string

	Port            string
	SkipAutoMigrate bool

	JWTSecret string
	Judge0URL string

	SMTPHost string
	SMTPPort string
	SMTPUser string
	SMTPPass string
	SMTPFrom string
	AppURL   string

	AllowedOrigins []string

	GoogleClientID string
}

func Load() Config {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" || jwtSecret == "dev-secret-change-in-prod" || len(jwtSecret) < 32 {
		log.Fatal("JWT_SECRET must be set to a strong random value (>=32 chars)")
	}

	appURL := getEnv("APP_URL", "http://localhost:5173")

	allowed := []string{appURL}
	if extra := os.Getenv("ALLOWED_ORIGINS"); extra != "" {
		for _, o := range strings.Split(extra, ",") {
			if o = strings.TrimSpace(o); o != "" {
				allowed = append(allowed, o)
			}
		}
	}

	return Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBUser:      getEnv("DB_USER", "postgres"),
		DBPassword:  getEnv("DB_PASSWORD", "postgres"),
		DBName:      getEnv("DB_NAME", "apex"),
		DBSSLMode:   getEnv("DB_SSLMODE", "disable"),

		Port:            getEnv("PORT", "8080"),
		SkipAutoMigrate: strings.EqualFold(os.Getenv("SKIP_AUTOMIGRATE"), "true"),

		JWTSecret: jwtSecret,
		Judge0URL: getEnv("JUDGE0_URL", "https://ce.judge0.com"),

		SMTPHost: getEnv("SMTP_HOST", ""),
		SMTPPort: getEnv("SMTP_PORT", "587"),
		SMTPUser: getEnv("SMTP_USER", ""),
		SMTPPass: getEnv("SMTP_PASS", ""),
		SMTPFrom: getEnv("SMTP_FROM", ""),
		AppURL:   appURL,

		AllowedOrigins: allowed,

		GoogleClientID: getEnv("GOOGLE_CLIENT_ID", ""),
	}
}

// DSN returns a GORM/pgx-compatible connection string.
// Prefers DATABASE_URL (Railway, Heroku-style) when set; falls back to discrete vars.
func (c Config) DSN() string {
	if c.DatabaseURL != "" {
		return c.DatabaseURL
	}
	dsn := "host=" + c.DBHost + " port=" + c.DBPort + " user=" + c.DBUser + " dbname=" + c.DBName + " sslmode=" + c.DBSSLMode
	if c.DBPassword != "" {
		dsn += " password=" + c.DBPassword
	}
	return dsn
}

// MigrateURL returns a URL-form connection string suitable for golang-migrate.
func (c Config) MigrateURL() string {
	if c.DatabaseURL != "" {
		return c.DatabaseURL
	}
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(c.DBUser, c.DBPassword),
		Host:   c.DBHost + ":" + c.DBPort,
		Path:   "/" + c.DBName,
	}
	q := u.Query()
	q.Set("sslmode", c.DBSSLMode)
	u.RawQuery = q.Encode()
	return u.String()
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
