package problem

import (
	"apex/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(public, protected *gin.RouterGroup) {
	// Add problem to exam
	exams := protected.Group("/exams")
	exams.Use(middleware.RequireRole("teacher"))
	{
		exams.POST("/:id/problems", AddProblem)
	}

	// Problem CRUD + question bank
	problems := protected.Group("/problems")
	problems.Use(middleware.RequireRole("teacher"))
	{
		problems.GET("", GetAllProblems)
		problems.GET("/:id", GetProblem)
		problems.PUT("/:id", UpdateProblem)
		problems.DELETE("/:id", DeleteProblem)
	}
}
