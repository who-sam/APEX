package config

import "os"

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
	Judge0URL  string
	ServerPort string
	CORSOrigin string
}

func Load() Config {
	return Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "kernel"),
		JWTSecret:  getEnv("JWT_SECRET", "dev-secret-change-in-prod"),
		Judge0URL:  getEnv("JUDGE0_URL", "https://ce.judge0.com"),
		ServerPort: getEnv("SERVER_PORT", "8080"),
		CORSOrigin: getEnv("CORS_ORIGIN", "http://localhost:5173"),
	}
}

func (c Config) DSN() string {
	return "host=" + c.DBHost +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" port=" + c.DBPort +
		" sslmode=disable TimeZone=UTC"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
