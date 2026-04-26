package notification

import "github.com/gin-gonic/gin"

func RegisterRoutes(public, protected *gin.RouterGroup) {
	protected.GET("/notifications", GetNotifications)
	protected.PUT("/notifications/:id/read", MarkRead)
	protected.PUT("/notifications/read-all", MarkAllRead)
	protected.GET("/notifications/unread-count", GetUnreadCount)
}
