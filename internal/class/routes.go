package class

import (
	"apex/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(public, protected *gin.RouterGroup) {
	classes := protected.Group("/classes")
	classes.Use(middleware.RequireRole("teacher"))
	{
		classes.POST("", CreateClass)
		classes.GET("", GetClasses)
		classes.GET("/:id", GetClass)
		classes.PUT("/:id", UpdateClass)
		classes.DELETE("/:id", DeleteClass)
		classes.GET("/:id/stats", GetClassStats)
		classes.DELETE("/:id/members/:userId", RemoveClassMember)
	}
}
