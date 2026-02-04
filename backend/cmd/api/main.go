package main

import (
	"fmt"
	"log"
	"time"

	"financial-reporting-system/internal/auth"
	"financial-reporting-system/internal/cache"
	"financial-reporting-system/internal/config"
	dbconn "financial-reporting-system/internal/db"
	"financial-reporting-system/internal/reports"
	"financial-reporting-system/internal/server"
	
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	_ = godotenv.Load() // Ignore error if .env doesn't exist (e.g., in production with actual env vars)
	
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	pool, err := dbconn.NewPool(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("Database connection established")

	// Initialize cache (5 minute TTL)
	reportCache := cache.New(5 * 60 * time.Second)

	// Initialize services
	reportService := reports.NewService(pool, reportCache, cfg.DBSchema)

	// Initialize handlers
	authHandler := auth.NewHandler(pool, cfg.JWTSecret)
	reportHandler := reports.NewHandler(reportService)

	// Initialize server
	srv := server.NewServer(authHandler, reportHandler)

	// Start server
	addr := fmt.Sprintf("%s:%s", cfg.ServerHost, cfg.ServerPort)
	log.Printf("Starting server on %s", addr)
	if err := srv.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

