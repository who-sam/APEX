package main

import (
	"net/http"
	"os"
	"time"

	"apex/internal/announcement"
	"apex/internal/auth"
	"apex/internal/class"
	"apex/internal/config"
	"apex/internal/database"
	"apex/internal/email"
	"apex/internal/exam"
	"apex/internal/execute"
	"apex/internal/folder"
	"apex/internal/judge0"
	"apex/internal/middleware"
	"apex/internal/notification"
	"apex/internal/problem"
	"apex/internal/profile"
	"apex/internal/reminder"
	"apex/internal/student"
	"apex/internal/submission"
	"apex/internal/teacher"
	"apex/internal/testcase"

	"github.com/gin-gonic/gin"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "--healthcheck" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		client := &http.Client{Timeout: 2 * time.Second}
		resp, err := client.Get("http://127.0.0.1:" + port + "/healthz")
		if err != nil || resp.StatusCode != http.StatusOK {
			os.Exit(1)
		}
		_ = resp.Body.Close()
		os.Exit(0)
	}

	cfg := config.Load()
	database.Connect(cfg)
	auth.Init(cfg)
	email.Init(cfg)
	judge0.Init(cfg.Judge0URL)
	reminder.Start()

	r := gin.Default()
	r.Use(middleware.CORS(cfg.AllowedOrigins))

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	public := r.Group("/api")
	protected := r.Group("/api")
	protected.Use(middleware.Auth(cfg.JWTSecret))

	auth.RegisterRoutes(public, protected)
	class.RegisterRoutes(public, protected)
	student.RegisterRoutes(public, protected)
	exam.RegisterRoutes(public, protected)
	problem.RegisterRoutes(public, protected)
	testcase.RegisterRoutes(public, protected)
	submission.RegisterRoutes(public, protected)
	execute.RegisterRoutes(public, protected)
	notification.RegisterRoutes(public, protected)
	profile.RegisterRoutes(public, protected)
	teacher.RegisterRoutes(public, protected)
	announcement.RegisterRoutes(public, protected)
	folder.RegisterRoutes(public, protected)

	_ = r.Run(":" + cfg.Port)
}
