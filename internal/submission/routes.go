package submission

import (
	"apex/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(public, protected *gin.RouterGroup) {
	subs := protected.Group("/submissions")
	{
		subs.POST("", SubmitSolution)
		subs.POST("/run", RunSolution)
		subs.GET("/:id", GetSubmission)
		subs.PUT("/:id/grade", middleware.RequireRole("teacher"), GradeSubmission)
	}
}
