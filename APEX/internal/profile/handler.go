package profile

import (
	"apex/internal/database"
	"apex/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	database.DB.First(&user, userID)

	var prof models.UserProfile
	result := database.DB.Where("user_id = ?", userID).First(&prof)
	if result.Error != nil {
		prof = models.UserProfile{
			UserID:              userID,
			NotifyEmail:         true,
			NotifyPush:          true,
			NotifyExamReminders: true,
		}
		database.DB.Create(&prof)
	}

	c.JSON(http.StatusOK, gin.H{
		"user":    user,
		"profile": prof,
	})
}

type updateProfileRequest struct {
	Name                *string `json:"name"`
	Bio                 *string `json:"bio"`
	AvatarURL           *string `json:"avatar_url"`
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

	// Update user name if provided
	if req.Name != nil {
		database.DB.Model(&models.User{}).Where("id = ?", userID).Update("name", *req.Name)
	}

	var prof models.UserProfile
	result := database.DB.Where("user_id = ?", userID).First(&prof)
	if result.Error != nil {
		prof = models.UserProfile{
			UserID:              userID,
			NotifyEmail:         true,
			NotifyPush:          true,
			NotifyExamReminders: true,
		}
		database.DB.Create(&prof)
	}

	updates := map[string]any{}
	if req.Bio != nil {
		updates["bio"] = *req.Bio
	}
	if req.AvatarURL != nil {
		updates["avatar_url"] = *req.AvatarURL
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
		database.DB.Model(&prof).Updates(updates)
	}

	database.DB.Where("user_id = ?", userID).First(&prof)
	c.JSON(http.StatusOK, prof)
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
