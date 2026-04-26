package submission

import "github.com/gin-gonic/gin"

func RegisterRoutes(public, protected *gin.RouterGroup) {
	subs := protected.Group("/submissions")
	{
		subs.POST("", SubmitSolution)
		subs.POST("/run", RunSolution)
		subs.GET("/:id", GetSubmission)
		subs.PUT("/:id/grade", GradeSubmission)
	}
}
