package profile

import "github.com/gin-gonic/gin"

func RegisterRoutes(public, protected *gin.RouterGroup) {
	protected.GET("/profile", GetProfile)
	protected.PUT("/profile", UpdateProfile)
	protected.PUT("/profile/password", ChangePassword)
}
