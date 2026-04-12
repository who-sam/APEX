package student

import (
	"apex/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(public, protected *gin.RouterGroup) {
	s := protected.Group("/student")
	s.Use(middleware.RequireRole("student"))
	{
		s.POST("/classes/join", JoinClass)
		s.GET("/classes", GetClasses)
		s.GET("/exams", GetExams)
		s.GET("/exams/:id", GetExam)
		s.GET("/submissions", GetSubmissions)
		s.GET("/stats", GetStats)
		s.GET("/performance", GetPerformance)
		s.GET("/practice", GetPractice)
	}
}
