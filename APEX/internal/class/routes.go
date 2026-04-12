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
		classes.DELETE("/:id", DeleteClass)
		classes.GET("/:id/stats", GetClassStats)
	}
}
