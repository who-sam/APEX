package auth

import (
	"apex/internal/config"
	"apex/internal/database"
	"apex/internal/models"
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var cfg config.Config

func Init(c config.Config) {
	cfg = c
}

type signupRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Role     string `json:"role" binding:"required"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

func Signup(c *gin.Context) {
	var req signupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "all fields are required"})
		return
	}

	if !emailRegex.MatchString(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email format"})
		return
	}
	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 6 characters"})
		return
	}
	if req.Role != "teacher" && req.Role != "student" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role must be teacher or student"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := models.User{
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         req.Role,
		Name:         req.Name,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}

	// Auto-create profile
	profile := models.UserProfile{
		UserID:              user.ID,
		NotifyEmail:         true,
		NotifyPush:          true,
		NotifyExamReminders: true,
	}
	database.DB.Create(&profile)

	token, err := generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"token": token, "user": user})
}

func Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email and password are required"})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	token, err := generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
}

func DeleteAccount(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	role := c.MustGet("role").(string)

	tx := database.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to start transaction"})
		return
	}

	// Shared (both roles)
	if err := tx.Where("user_id = ?", userID).Delete(&models.UserProfile{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete profile"})
		return
	}
	if err := tx.Where("user_id = ?", userID).Delete(&models.Notification{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete notifications"})
		return
	}
	if err := tx.Where("from_id = ? OR to_id = ?", userID, userID).Delete(&models.Message{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete messages"})
		return
	}
	if err := tx.Where("user_id = ?", userID).Delete(&models.TeamMember{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete team memberships"})
		return
	}

	if role == "teacher" {
		// Collect class IDs taught by this teacher, then clear class-scoped children
		var classIDs []uint
		tx.Model(&models.Class{}).Where("teacher_id = ?", userID).Pluck("id", &classIDs)
		if len(classIDs) > 0 {
			if err := tx.Where("class_id IN ?", classIDs).Delete(&models.ClassMember{}).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete class members"})
				return
			}
			if err := tx.Where("class_id IN ?", classIDs).Delete(&models.ExamClass{}).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete exam-class links"})
				return
			}
		}
		// Collect exam IDs by teacher, cascade exam -> problems/testcases/submissions/exam_classes
		var examIDs []uint
		tx.Model(&models.Exam{}).Where("teacher_id = ?", userID).Pluck("id", &examIDs)
		if len(examIDs) > 0 {
			var problemIDs []uint
			tx.Model(&models.Problem{}).Where("exam_id IN ?", examIDs).Pluck("id", &problemIDs)
			if len(problemIDs) > 0 {
				if err := tx.Where("problem_id IN ?", problemIDs).Delete(&models.Submission{}).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete submissions"})
					return
				}
				if err := tx.Where("problem_id IN ?", problemIDs).Delete(&models.TestCase{}).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete test cases"})
					return
				}
			}
			if err := tx.Where("exam_id IN ?", examIDs).Delete(&models.Problem{}).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete problems"})
				return
			}
			if err := tx.Where("exam_id IN ?", examIDs).Delete(&models.ExamClass{}).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete exam-class links"})
				return
			}
		}
		if err := tx.Where("teacher_id = ?", userID).Delete(&models.Exam{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete exams"})
			return
		}
		if err := tx.Where("teacher_id = ?", userID).Delete(&models.Announcement{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete announcements"})
			return
		}
		if err := tx.Where("teacher_id = ?", userID).Delete(&models.Class{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete classes"})
			return
		}
	} else {
		// Student
		if err := tx.Where("user_id = ?", userID).Delete(&models.ClassMember{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to leave classes"})
			return
		}
		if err := tx.Where("user_id = ?", userID).Delete(&models.Submission{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete submissions"})
			return
		}
	}

	if err := tx.Delete(&models.User{}, userID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete account"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to commit deletion"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "account deleted"})
}

func generateToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
		"name":    user.Name,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}
