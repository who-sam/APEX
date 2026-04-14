package teacher

import (
	"apex/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(public, protected *gin.RouterGroup) {
	t := protected.Group("/teacher")
	t.Use(middleware.RequireRole("teacher"))
	{
		t.GET("/dashboard", GetDashboard)
		t.GET("/grading/pending", GetPendingGrading)
	}
}
