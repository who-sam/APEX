package main

import (
	"apex/internal/announcement"
	"apex/internal/auth"
	"apex/internal/class"
	"apex/internal/config"
	"apex/internal/database"
	"apex/internal/email"
	"apex/internal/exam"
	"apex/internal/execute"
	"apex/internal/folder"
	"apex/internal/leaderboard"
	"apex/internal/message"
	"apex/internal/middleware"
	"apex/internal/notification"
	"apex/internal/problem"
	"apex/internal/profile"
	"apex/internal/reminder"
	"apex/internal/student"
	"apex/internal/submission"
	"apex/internal/teacher"
	"apex/internal/team"
	"apex/internal/testcase"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	database.Connect(cfg)
	auth.Init(cfg)
	email.Init(cfg)
	reminder.Start()

	r := gin.Default()
	r.Use(middleware.CORS())

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
	leaderboard.RegisterRoutes(public, protected)
	profile.RegisterRoutes(public, protected)
	message.RegisterRoutes(public, protected)
	team.RegisterRoutes(public, protected)
	teacher.RegisterRoutes(public, protected)
	announcement.RegisterRoutes(public, protected)
	folder.RegisterRoutes(public, protected)

	r.Run(":8080")
}
