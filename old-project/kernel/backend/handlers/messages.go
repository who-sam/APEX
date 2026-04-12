package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetMessages(c *gin.Context) {
	userID := c.GetUint("user_id")
	var messages []models.Message
	database.DB.Where("to_id = ?", userID).Preload("FromUser").Order("created_at DESC").Find(&messages)
	c.JSON(http.StatusOK, messages)
}

func GetMessage(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var msg models.Message
	if err := database.DB.Preload("FromUser").First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}
	if msg.ToID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your message"})
		return
	}
	c.JSON(http.StatusOK, msg)
}

func CreateMessage(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req struct {
		RecipientID uint   `json:"recipient_id" binding:"required"`
		Subject     string `json:"subject" binding:"required"`
		Body        string `json:"body" binding:"required"`
		Type        string `json:"type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "recipient_id, subject, and body are required"})
		return
	}
	if len(req.Subject) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "subject must be at most 255 characters"})
		return
	}

	msgType := req.Type
	if msgType == "" {
		msgType = "direct"
	}

	msg := models.Message{
		FromID:  userID,
		ToID:    req.RecipientID,
		Subject: req.Subject,
		Body:    req.Body,
		Type:    msgType,
	}
	if err := database.DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send message"})
		return
	}

	// Notify recipient
	database.DB.Create(&models.Notification{
		UserID:      req.RecipientID,
		Type:        "system",
		Title:       "New Message",
		Description: "You received a new message: " + req.Subject,
		LinkTo:      "/messages",
	})

	c.JSON(http.StatusCreated, msg)
}

func MarkMessageRead(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var msg models.Message
	if err := database.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}
	if msg.ToID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your message"})
		return
	}
	database.DB.Model(&msg).Update("read", true)
	c.JSON(http.StatusOK, gin.H{"message": "marked as read"})
}

func ToggleMessageStar(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var msg models.Message
	if err := database.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}
	if msg.ToID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your message"})
		return
	}
	database.DB.Model(&msg).Update("starred", !msg.Starred)
	c.JSON(http.StatusOK, gin.H{"message": "toggled star"})
}

func DeleteMessage(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var msg models.Message
	if err := database.DB.First(&msg, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}
	if msg.ToID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your message"})
		return
	}
	database.DB.Delete(&msg)
	c.JSON(http.StatusOK, gin.H{"message": "message deleted"})
}
