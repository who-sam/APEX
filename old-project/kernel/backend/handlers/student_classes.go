package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func JoinClass(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req struct {
		InviteCode string `json:"invite_code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invite_code is required"})
		return
	}

	code := strings.TrimSpace(strings.ToUpper(req.InviteCode))
	var class models.Class
	if err := database.DB.Where("invite_code = ?", code).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "invalid invite code"})
		return
	}

	var existing int64
	database.DB.Model(&models.ClassMember{}).Where("class_id = ? AND user_id = ?", class.ID, userID).Count(&existing)
	if existing > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "already a member of this class"})
		return
	}

	member := models.ClassMember{ClassID: class.ID, UserID: userID}
	database.DB.Create(&member)

	// Notify teacher
	database.DB.Create(&models.Notification{
		UserID:      class.TeacherID,
		Type:        "class",
		Title:       "New Student Joined",
		Description: "A new student joined " + class.Name,
		LinkTo:      "/classes",
	})

	c.JSON(http.StatusOK, gin.H{"message": "joined class successfully", "class": class})
}

func GetStudentClasses(c *gin.Context) {
	userID := c.GetUint("user_id")
	var memberships []models.ClassMember
	database.DB.Where("user_id = ?", userID).Preload("Class").Find(&memberships)

	type classWithCount struct {
		models.Class
		MemberCount int64 `json:"member_count"`
	}
	result := make([]classWithCount, 0, len(memberships))
	for _, m := range memberships {
		var count int64
		database.DB.Model(&models.ClassMember{}).Where("class_id = ?", m.ClassID).Count(&count)
		result = append(result, classWithCount{Class: m.Class, MemberCount: count})
	}
	c.JSON(http.StatusOK, result)
}
