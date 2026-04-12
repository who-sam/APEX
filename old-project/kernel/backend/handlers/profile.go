package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var profile models.UserProfile
	result := database.DB.Where("user_id = ?", userID).First(&profile)
	if result.Error != nil {
		profile = models.UserProfile{
			UserID:              userID,
			NotifyEmail:         true,
			NotifyPush:          true,
			NotifyExamReminders: true,
		}
		database.DB.Create(&profile)
	}

	c.JSON(http.StatusOK, gin.H{
		"id":                    user.ID,
		"email":                 user.Email,
		"name":                  user.Name,
		"role":                  user.Role,
		"created_at":            user.CreatedAt,
		"bio":                   profile.Bio,
		"notify_email":          profile.NotifyEmail,
		"notify_push":           profile.NotifyPush,
		"notify_exam_reminders": profile.NotifyExamReminders,
		"notify_results":        profile.NotifyResults,
	})
}

func UpdateProfile(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req struct {
		Name                *string `json:"name"`
		Bio                 *string `json:"bio"`
		NotifyEmail         *bool   `json:"notify_email"`
		NotifyPush          *bool   `json:"notify_push"`
		NotifyExamReminders *bool   `json:"notify_exam_reminders"`
		NotifyResults       *bool   `json:"notify_results"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Update User.Name if provided
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if len(name) < 1 || len(name) > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name must be between 1 and 100 characters"})
			return
		}
		database.DB.Model(&models.User{}).Where("id = ?", userID).Update("name", name)
	}

	// Ensure profile exists
	var profile models.UserProfile
	result := database.DB.Where("user_id = ?", userID).First(&profile)
	if result.Error != nil {
		profile = models.UserProfile{
			UserID:              userID,
			NotifyEmail:         true,
			NotifyPush:          true,
			NotifyExamReminders: true,
		}
		database.DB.Create(&profile)
	}

	// Update profile fields
	updates := map[string]any{}
	if req.Bio != nil {
		updates["bio"] = *req.Bio
	}
	if req.NotifyEmail != nil {
		updates["notify_email"] = *req.NotifyEmail
	}
	if req.NotifyPush != nil {
		updates["notify_push"] = *req.NotifyPush
	}
	if req.NotifyExamReminders != nil {
		updates["notify_exam_reminders"] = *req.NotifyExamReminders
	}
	if req.NotifyResults != nil {
		updates["notify_results"] = *req.NotifyResults
	}
	if len(updates) > 0 {
		database.DB.Model(&profile).Updates(updates)
	}

	c.JSON(http.StatusOK, gin.H{"message": "profile updated"})
}

func UpdatePassword(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "current_password and new_password are required"})
		return
	}

	if len(req.NewPassword) < 6 || len(req.NewPassword) > 128 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "new password must be between 6 and 128 characters"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "current password is incorrect"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	database.DB.Model(&user).Update("password_hash", string(hash))
	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}
