package server

import (
	"financial-reporting-system/internal/auth"
	"financial-reporting-system/internal/reports"

	"github.com/gin-gonic/gin"
)

type Server struct {
	router        *gin.Engine
	authHandler   *auth.Handler
	reportHandler *reports.Handler
}

func NewServer(authHandler *auth.Handler, reportHandler *reports.Handler) *Server {
	if gin.Mode() == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	s := &Server{
		router:        gin.Default(),
		authHandler:   authHandler,
		reportHandler: reportHandler,
	}

	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	// CORS middleware - MUST be before routes
	s.router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check
	s.router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := s.router.Group("/api")
	{
		// Auth routes (no auth required)
		auth := api.Group("/auth")
		{
			auth.POST("/login", s.authHandler.Login)
		}

		// Report routes (auth required)
		reports := api.Group("/reports")
		reports.Use(s.authHandler.RequireAuth())
		{
			reports.GET("/profit-loss", s.reportHandler.GetProfitLoss)
			reports.GET("/revenue-category", s.reportHandler.GetRevenueByCategory)
			reports.GET("/top-customers", s.reportHandler.GetTopCustomers)
			reports.GET("/parallel", s.reportHandler.GetMultipleReportsParallel)
		}
	}
}

func (s *Server) Run(addr string) error {
	return s.router.Run(addr)
}

