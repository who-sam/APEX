package config

import "os"

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
}

func Load() Config {
	return Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "codejudge"),
		JWTSecret:  getEnv("JWT_SECRET", "dev-secret-change-in-prod"),
	}
}

func (c Config) DSN() string {
	dsn := "host=" + c.DBHost + " port=" + c.DBPort + " user=" + c.DBUser + " dbname=" + c.DBName + " sslmode=disable"
	if c.DBPassword != "" {
		dsn += " password=" + c.DBPassword
	}
	return dsn
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
