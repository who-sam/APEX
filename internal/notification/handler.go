package notification

import (
	"apex/internal/database"
	"apex/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetNotifications(c *gin.Context) {
	userID := c.GetUint("user_id")

	var notifications []models.Notification
	database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&notifications)

	c.JSON(http.StatusOK, notifications)
}

func MarkRead(c *gin.Context) {
	userID := c.GetUint("user_id")
	notifID := c.Param("id")

	result := database.DB.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", notifID, userID).
		Update("read", true)

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "marked as read"})
}

func MarkAllRead(c *gin.Context) {
	userID := c.GetUint("user_id")

	database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read = ?", userID, false).
		Update("read", true)

	c.JSON(http.StatusOK, gin.H{"message": "all notifications marked as read"})
}

func GetUnreadCount(c *gin.Context) {
	userID := c.GetUint("user_id")

	var count int64
	database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read = ?", userID, false).
		Count(&count)

	c.JSON(http.StatusOK, gin.H{"count": count})
}
