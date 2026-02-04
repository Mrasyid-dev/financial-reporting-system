package config

import (
	"fmt"
	"os"
)

type Config struct {
	DBHost       string
	DBPort       string
	DBUser       string
	DBPass       string
	DBName       string
	DBSchema     string
	ServerPort   string
	ServerHost   string
	JWTSecret    string
	Environment  string
}

func Load() (*Config, error) {
	cfg := &Config{
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5434"),
		DBUser:      getEnv("DB_USER", "postgres"),
		DBPass:      getEnv("DB_PASS", "postgres"),
		DBName:      getEnv("DB_NAME", "financial_db"),
		DBSchema:    getEnv("DB_SCHEMA", "public"),
		ServerPort:  getEnv("SERVER_PORT", "8080"),
		ServerHost:  getEnv("SERVER_HOST", "0.0.0.0"),
		JWTSecret:   getEnv("JWT_SECRET", "financial_reporting_demo_secret_key_2024"),
		Environment: getEnv("ENVIRONMENT", "development"),
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func (c *Config) DatabaseURL() string {
	// Untuk Supabase, gunakan sslmode=require
	sslMode := "disable"
	if c.Environment == "production" || c.DBHost != "localhost" {
		sslMode = "require"
	}
	
	// Tambahkan search_path untuk custom schema
	searchPath := ""
	if c.DBSchema != "public" && c.DBSchema != "" {
		searchPath = fmt.Sprintf("&search_path=%s", c.DBSchema)
	}
	
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s%s",
		c.DBUser, c.DBPass, c.DBHost, c.DBPort, c.DBName, sslMode, searchPath,
	)
}

