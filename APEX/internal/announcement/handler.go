package announcement

import (
	"apex/internal/database"
	"apex/internal/models"
	"apex/internal/notification"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type createRequest struct {
	Title       string `json:"title" binding:"required"`
	Body        string `json:"body"`
	Attachments string `json:"attachments"`
}

// ListByClass returns announcements for a class. Accessible to teacher (owner) and enrolled students.
func ListByClass(c *gin.Context) {
	userID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.First(&class, classID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	// Authorize: teacher owner OR enrolled member
	if class.TeacherID != userID {
		var count int64
		database.DB.Model(&models.ClassMember{}).Where("class_id = ? AND user_id = ?", class.ID, userID).Count(&count)
		if count == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
	}

	var announcements []models.Announcement
	database.DB.Where("class_id = ?", class.ID).Order("created_at desc").Find(&announcements)
	c.JSON(http.StatusOK, announcements)
}

// Create creates a new announcement (teacher owner only).
func Create(c *gin.Context) {
	userID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, userID).First(&class).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	var req createRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}

	attachments := req.Attachments
	if attachments == "" || attachments == "null" {
		attachments = "[]"
	}
	a := models.Announcement{
		ClassID:     class.ID,
		TeacherID:   userID,
		Title:       req.Title,
		Body:        req.Body,
		Attachments: attachments,
	}
	if err := database.DB.Create(&a).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create announcement"})
		return
	}

	// Notify each enrolled student.
	var memberIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("class_id = ?", class.ID).Pluck("user_id", &memberIDs)
	link := fmt.Sprintf("/dashboard/courses/%d?tab=announcements", class.ID)
	for _, uid := range memberIDs {
		notification.Create(uid, "announcement",
			class.Name+": "+a.Title,
			a.Body,
			link,
		)
	}

	c.JSON(http.StatusCreated, a)
}

type updateRequest struct {
	Title       *string `json:"title"`
	Body        *string `json:"body"`
	Attachments *string `json:"attachments"`
}

// Update edits an announcement (teacher owner only).
func Update(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var a models.Announcement
	if err := database.DB.First(&a, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "announcement not found"})
		return
	}
	if a.TeacherID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	var req updateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		if *req.Title == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
			return
		}
		updates["title"] = *req.Title
	}
	if req.Body != nil {
		updates["body"] = *req.Body
	}
	if req.Attachments != nil {
		v := *req.Attachments
		if v == "" || v == "null" {
			v = "[]"
		}
		updates["attachments"] = v
	}

	if len(updates) > 0 {
		if err := database.DB.Model(&a).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update"})
			return
		}
	}

	database.DB.First(&a, id)
	c.JSON(http.StatusOK, a)
}

// Delete removes an announcement (teacher owner only).
func Delete(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	var a models.Announcement
	if err := database.DB.First(&a, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "announcement not found"})
		return
	}
	if a.TeacherID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	database.DB.Delete(&a)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
