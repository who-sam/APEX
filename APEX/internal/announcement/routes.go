package announcement

import "github.com/gin-gonic/gin"

func RegisterRoutes(public, protected *gin.RouterGroup) {
	_ = public
	protected.GET("/classes/:id/announcements", ListByClass)
	protected.POST("/classes/:id/announcements", Create)
	protected.DELETE("/announcements/:id", Delete)
}
