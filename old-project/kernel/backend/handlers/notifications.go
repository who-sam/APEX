package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetNotifications(c *gin.Context) {
	userID := c.GetUint("user_id")
	var notifications []models.Notification
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications)
	c.JSON(http.StatusOK, notifications)
}

func MarkNotificationRead(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var notif models.Notification
	if err := database.DB.First(&notif, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		return
	}
	if notif.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your notification"})
		return
	}
	database.DB.Model(&notif).Update("read", true)
	c.JSON(http.StatusOK, gin.H{"message": "marked as read"})
}

func MarkAllNotificationsRead(c *gin.Context) {
	userID := c.GetUint("user_id")
	database.DB.Model(&models.Notification{}).Where("user_id = ? AND read = ?", userID, false).Update("read", true)
	c.JSON(http.StatusOK, gin.H{"message": "all notifications marked as read"})
}

func GetUnreadNotificationCount(c *gin.Context) {
	userID := c.GetUint("user_id")
	var count int64
	database.DB.Model(&models.Notification{}).Where("user_id = ? AND read = ?", userID, false).Count(&count)
	c.JSON(http.StatusOK, gin.H{"count": count})
}
