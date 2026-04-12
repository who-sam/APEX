package exam

import (
	"apex/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(public, protected *gin.RouterGroup) {
	exams := protected.Group("/exams")
	exams.Use(middleware.RequireRole("teacher"))
	{
		exams.POST("", CreateExam)
		exams.GET("", GetExams)
		exams.GET("/:id", GetExam)
		exams.PUT("/:id", UpdateExam)
		exams.DELETE("/:id", DeleteExam)
		exams.POST("/:id/assign", AssignExam)
		exams.GET("/:id/results", GetExamResults)
	}
}
