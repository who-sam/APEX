package message

import (
	"apex/internal/database"
	"apex/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetMessages(c *gin.Context) {
	userID := c.GetUint("user_id")

	var messages []models.Message
	database.DB.Where("to_id = ?", userID).
		Preload("FromUser").
		Order("created_at desc").
		Find(&messages)

	c.JSON(http.StatusOK, messages)
}

func GetMessage(c *gin.Context) {
	userID := c.GetUint("user_id")
	messageID := c.Param("id")

	var msg models.Message
	if err := database.DB.Where("id = ? AND to_id = ?", messageID, userID).
		Preload("FromUser").
		First(&msg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}

	c.JSON(http.StatusOK, msg)
}

type createMessageRequest struct {
	ToID    uint   `json:"to_id" binding:"required"`
	Subject string `json:"subject" binding:"required"`
	Body    string `json:"body" binding:"required"`
	Type    string `json:"type"`
}

func CreateMessage(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req createMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "to_id, subject, and body are required"})
		return
	}

	msgType := "direct"
	if req.Type != "" {
		msgType = req.Type
	}

	msg := models.Message{
		FromID:  userID,
		ToID:    req.ToID,
		Subject: req.Subject,
		Body:    req.Body,
		Type:    msgType,
	}

	if err := database.DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create message"})
		return
	}

	c.JSON(http.StatusCreated, msg)
}

func MarkRead(c *gin.Context) {
	userID := c.GetUint("user_id")
	messageID := c.Param("id")

	var msg models.Message
	if err := database.DB.Where("id = ? AND to_id = ?", messageID, userID).First(&msg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}

	database.DB.Model(&msg).Update("read", true)
	c.JSON(http.StatusOK, gin.H{"message": "marked as read"})
}

func ToggleStar(c *gin.Context) {
	userID := c.GetUint("user_id")
	messageID := c.Param("id")

	var msg models.Message
	if err := database.DB.Where("id = ? AND to_id = ?", messageID, userID).First(&msg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}

	database.DB.Model(&msg).Update("starred", !msg.Starred)
	c.JSON(http.StatusOK, gin.H{"starred": !msg.Starred})
}

func DeleteMessage(c *gin.Context) {
	userID := c.GetUint("user_id")
	messageID := c.Param("id")

	result := database.DB.Where("id = ? AND to_id = ?", messageID, userID).Delete(&models.Message{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "message deleted"})
}
