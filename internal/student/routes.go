package student

import (
	"apex/internal/exam"
	"apex/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(public, protected *gin.RouterGroup) {
	s := protected.Group("/student")
	s.Use(middleware.RequireRole("student"))
	{
		s.POST("/classes/join", JoinClass)
		s.DELETE("/classes/:id", LeaveClass)
		s.GET("/classes", GetClasses)
		s.GET("/classes/:id", GetClass)
		s.GET("/exams", GetExams)
		s.GET("/exams/:id", GetExam)
		s.GET("/submissions", GetSubmissions)
		s.GET("/stats", GetStats)
		s.GET("/performance", GetPerformance)
		s.POST("/exams/:id/start", exam.StartAttempt)
		s.PUT("/exams/:id/autosave", exam.AutosaveAttempt)
		s.POST("/exams/:id/submit", exam.SubmitAttempt)
	}

	// Student-accessible attempt fetch (reused on results pages)
	attempts := protected.Group("/attempts")
	{
		attempts.GET("/mine", exam.GetMyAttempts)
	}
}
