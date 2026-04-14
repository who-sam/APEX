package auth

import "github.com/gin-gonic/gin"

func RegisterRoutes(public, protected *gin.RouterGroup) {
	auth := public.Group("/auth")
	{
		auth.POST("/signup", Signup)
		auth.POST("/login", Login)
	}

	authProtected := protected.Group("/auth")
	{
		authProtected.DELETE("/account", DeleteAccount)
	}
}
