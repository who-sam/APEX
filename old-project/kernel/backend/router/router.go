package router

import (
	"kernel-backend/config"
	"kernel-backend/handlers"
	"kernel-backend/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine, cfg config.Config) {
	api := r.Group("/api")

	// Public routes with rate limiting
	auth := api.Group("/auth")
	auth.Use(middleware.IPRateLimiter(0.167, 10))
	{
		auth.POST("/signup", handlers.Signup)
		auth.POST("/login", handlers.Login)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.Auth(cfg.JWTSecret))
	{
		// Execute with rate limiting
		protected.POST("/execute",
			middleware.UserRateLimiter(0.333, 5),
			handlers.Execute,
		)

		// Teacher-only routes
		teacher := protected.Group("")
		teacher.Use(middleware.RequireRole("teacher"))
		{
			// Classes
			teacher.POST("/classes", handlers.CreateClass)
			teacher.GET("/classes", handlers.GetClasses)
			teacher.GET("/classes/:id", handlers.GetClass)
			teacher.DELETE("/classes/:id", handlers.DeleteClass)
			teacher.GET("/classes/:id/stats", handlers.GetClassStats)

			// Exams
			teacher.POST("/exams", handlers.CreateExam)
			teacher.GET("/exams", handlers.GetExams)
			teacher.GET("/exams/:id", handlers.GetExam)
			teacher.PUT("/exams/:id", handlers.UpdateExam)
			teacher.DELETE("/exams/:id", handlers.DeleteExam)
			teacher.POST("/exams/:id/assign", handlers.AssignExam)
			teacher.GET("/exams/:id/results", handlers.GetExamResults)
			teacher.GET("/exams/:id/results/export", handlers.ExportExamResults)

			// Problems
			teacher.POST("/exams/:id/problems", handlers.AddProblem)
			teacher.GET("/problems/:id", handlers.GetProblem)
			teacher.PUT("/problems/:id", handlers.UpdateProblem)
			teacher.DELETE("/problems/:id", handlers.DeleteProblem)

			// Test cases
			teacher.POST("/problems/:id/test-cases", handlers.AddTestCase)
			teacher.PUT("/test-cases/:id", handlers.UpdateTestCase)
			teacher.DELETE("/test-cases/:id", handlers.DeleteTestCase)

			// Teacher dashboard
			teacher.GET("/teacher/dashboard", handlers.GetTeacherDashboard)
		}

		// Student-only routes
		student := protected.Group("/student")
		student.Use(middleware.RequireRole("student"))
		{
			student.POST("/classes/join", handlers.JoinClass)
			student.GET("/classes", handlers.GetStudentClasses)
			student.GET("/exams", handlers.GetStudentExams)
			student.GET("/exams/:id", handlers.GetStudentExam)
			student.GET("/submissions", handlers.GetStudentSubmissions)
			student.GET("/stats", handlers.GetStudentStats)
			student.GET("/performance", handlers.GetStudentPerformance)
			student.GET("/practice", handlers.GetStudentPractice)
		}

		// Any authenticated user
		// Submissions with rate limiting
		protected.POST("/submissions",
			middleware.UserRateLimiter(0.167, 3),
			handlers.SubmitSolution,
		)
		protected.POST("/submissions/run",
			middleware.UserRateLimiter(0.333, 5),
			handlers.RunSolution,
		)
		protected.GET("/submissions/:id", handlers.GetSubmission)

		// Notifications
		protected.GET("/notifications", handlers.GetNotifications)
		protected.PUT("/notifications/:id/read", handlers.MarkNotificationRead)
		protected.PUT("/notifications/read-all", handlers.MarkAllNotificationsRead)
		protected.GET("/notifications/unread-count", handlers.GetUnreadNotificationCount)

		// Leaderboard
		protected.GET("/leaderboard", handlers.GetLeaderboard)
		protected.GET("/leaderboard/global", handlers.GetGlobalLeaderboard)

		// Profile
		protected.GET("/profile", handlers.GetProfile)
		protected.PUT("/profile", handlers.UpdateProfile)
		protected.PUT("/profile/password", handlers.UpdatePassword)

		// Messages
		protected.GET("/messages", handlers.GetMessages)
		protected.GET("/messages/:id", handlers.GetMessage)
		protected.POST("/messages", handlers.CreateMessage)
		protected.PUT("/messages/:id/read", handlers.MarkMessageRead)
		protected.PUT("/messages/:id/star", handlers.ToggleMessageStar)
		protected.DELETE("/messages/:id", handlers.DeleteMessage)

		// Teams
		protected.GET("/teams", handlers.GetTeams)
		protected.GET("/teams/:id", handlers.GetTeam)
		protected.POST("/teams", handlers.CreateTeam)
		protected.POST("/teams/:id/members", handlers.AddTeamMember)
	}
}
