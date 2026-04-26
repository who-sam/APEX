package auth

import "github.com/gin-gonic/gin"

func RegisterRoutes(public, protected *gin.RouterGroup) {
	auth := public.Group("/auth")
	{
		auth.POST("/signup", Signup)
		auth.POST("/login", Login)
		auth.POST("/forgot-password", ForgotPassword)
		auth.POST("/reset-password", ResetPassword)
		auth.POST("/google", GoogleAuth)
	}

	authProtected := protected.Group("/auth")
	{
		authProtected.DELETE("/account", DeleteAccount)
	}
}
