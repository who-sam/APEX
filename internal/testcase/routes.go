package testcase

import (
	"apex/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(public, protected *gin.RouterGroup) {
	problems := protected.Group("/problems")
	problems.Use(middleware.RequireRole("teacher"))
	{
		problems.POST("/:id/test-cases", AddTestCase)
	}

	tcs := protected.Group("/test-cases")
	tcs.Use(middleware.RequireRole("teacher"))
	{
		tcs.PUT("/:id", UpdateTestCase)
		tcs.DELETE("/:id", DeleteTestCase)
	}
}
