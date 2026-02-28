package handlers

import (
	"codejudge-backend/database"
	"codejudge-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var profile models.UserProfile
	result := database.DB.Where("user_id = ?", userID).First(&profile)
	if result.Error != nil {
		// Auto-create profile if not exists
		profile = models.UserProfile{
			UserID:              userID,
			NotifyEmail:         true,
			NotifyPush:          true,
			NotifyExamReminders: true,
			NotifyResults:       false,
		}
		if err := database.DB.Create(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create profile"})
			return
		}
	}

	c.JSON(http.StatusOK, profile)
}

type updateProfileRequest struct {
	Bio                 *string `json:"bio"`
	NotifyEmail         *bool   `json:"notify_email"`
	NotifyPush          *bool   `json:"notify_push"`
	NotifyExamReminders *bool   `json:"notify_exam_reminders"`
	NotifyResults       *bool   `json:"notify_results"`
}

func UpdateProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	var profile models.UserProfile
	result := database.DB.Where("user_id = ?", userID).First(&profile)
	if result.Error != nil {
		// Auto-create profile if not exists
		profile = models.UserProfile{
			UserID:              userID,
			NotifyEmail:         true,
			NotifyPush:          true,
			NotifyExamReminders: true,
			NotifyResults:       false,
		}
		database.DB.Create(&profile)
	}

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

	database.DB.Where("user_id = ?", userID).First(&profile)
	c.JSON(http.StatusOK, profile)
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
}

func ChangePassword(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "current_password and new_password are required"})
		return
	}

	if len(req.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "new password must be at least 6 characters"})
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

	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}
