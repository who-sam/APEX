package message

import "github.com/gin-gonic/gin"

func RegisterRoutes(public, protected *gin.RouterGroup) {
	protected.GET("/messages", GetMessages)
	protected.GET("/messages/:id", GetMessage)
	protected.POST("/messages", CreateMessage)
	protected.PUT("/messages/:id/read", MarkRead)
	protected.PUT("/messages/:id/star", ToggleStar)
	protected.DELETE("/messages/:id", DeleteMessage)
}
