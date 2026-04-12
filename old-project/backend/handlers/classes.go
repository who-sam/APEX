package handlers

import (
	"codejudge-backend/database"
	"codejudge-backend/models"
	"crypto/rand"
	"math/big"
	"net/http"

	"github.com/gin-gonic/gin"
)

const inviteCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func generateInviteCode() string {
	code := make([]byte, 6)
	for i := range code {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(inviteCodeChars))))
		code[i] = inviteCodeChars[n.Int64()]
	}
	return string(code)
}

type createClassRequest struct {
	Name    string `json:"name" binding:"required"`
	Section string `json:"section"`
}

func CreateClass(c *gin.Context) {
	var req createClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	teacherID := c.GetUint("user_id")

	var inviteCode string
	for {
		inviteCode = generateInviteCode()
		var count int64
		database.DB.Model(&models.Class{}).Where("invite_code = ?", inviteCode).Count(&count)
		if count == 0 {
			break
		}
	}

	class := models.Class{
		TeacherID:  teacherID,
		Name:       req.Name,
		Section:    req.Section,
		InviteCode: inviteCode,
	}

	if err := database.DB.Create(&class).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create class"})
		return
	}

	c.JSON(http.StatusCreated, class)
}

func GetClasses(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	type ClassWithCount struct {
		models.Class
		MemberCount int64 `json:"member_count"`
	}

	var classes []models.Class
	database.DB.Where("teacher_id = ?", teacherID).Order("created_at desc").Find(&classes)

	result := make([]ClassWithCount, len(classes))
	for i, cls := range classes {
		var count int64
		database.DB.Model(&models.ClassMember{}).Where("class_id = ?", cls.ID).Count(&count)
		result[i] = ClassWithCount{Class: cls, MemberCount: count}
	}

	c.JSON(http.StatusOK, result)
}

func GetClass(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	var members []models.ClassMember
	database.DB.Where("class_id = ?", class.ID).Preload("User").Find(&members)

	c.JSON(http.StatusOK, gin.H{
		"class":   class,
		"members": members,
	})
}

func DeleteClass(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")

	result := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).Delete(&models.Class{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	database.DB.Where("class_id = ?", classID).Delete(&models.ClassMember{})
	database.DB.Where("class_id = ?", classID).Delete(&models.ExamClass{})

	c.JSON(http.StatusOK, gin.H{"message": "class deleted"})
}

type joinClassRequest struct {
	InviteCode string `json:"invite_code" binding:"required"`
}

func JoinClass(c *gin.Context) {
	var req joinClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invite_code is required"})
		return
	}

	userID := c.GetUint("user_id")

	var class models.Class
	if err := database.DB.Where("invite_code = ?", req.InviteCode).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "invalid invite code"})
		return
	}

	var existing int64
	database.DB.Model(&models.ClassMember{}).Where("class_id = ? AND user_id = ?", class.ID, userID).Count(&existing)
	if existing > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "already a member of this class"})
		return
	}

	member := models.ClassMember{
		ClassID: class.ID,
		UserID:  userID,
	}
	if err := database.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to join class"})
		return
	}

	// Notify teacher that a new student joined
	var student models.User
	database.DB.First(&student, userID)
	CreateNotificationHelper(class.TeacherID, "class",
		"New Student Joined",
		student.Name+" joined "+class.Name,
		"/dashboard/team",
	)

	c.JSON(http.StatusOK, gin.H{"message": "joined class successfully", "class": class})
}

func GetStudentClasses(c *gin.Context) {
	userID := c.GetUint("user_id")

	var memberships []models.ClassMember
	database.DB.Where("user_id = ?", userID).Preload("Class").Find(&memberships)

	type ClassInfo struct {
		models.Class
		MemberCount int64 `json:"member_count"`
	}

	result := make([]ClassInfo, len(memberships))
	for i, m := range memberships {
		var count int64
		database.DB.Model(&models.ClassMember{}).Where("class_id = ?", m.ClassID).Count(&count)
		result[i] = ClassInfo{Class: m.Class, MemberCount: count}
	}

	c.JSON(http.StatusOK, result)
}
