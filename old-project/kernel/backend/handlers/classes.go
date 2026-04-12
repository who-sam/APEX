package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"math/rand"
	"net/http"

	"github.com/gin-gonic/gin"
)

const inviteChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func generateInviteCode() string {
	for {
		code := make([]byte, 6)
		for i := range code {
			code[i] = inviteChars[rand.Intn(len(inviteChars))]
		}
		s := string(code)
		var count int64
		database.DB.Model(&models.Class{}).Where("invite_code = ?", s).Count(&count)
		if count == 0 {
			return s
		}
	}
}

func CreateClass(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	var req struct {
		Name    string `json:"name" binding:"required"`
		Section string `json:"section"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	if len(req.Name) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name must be at most 255 characters"})
		return
	}

	class := models.Class{
		TeacherID:  teacherID,
		Name:       req.Name,
		Section:    req.Section,
		InviteCode: generateInviteCode(),
	}
	if err := database.DB.Create(&class).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create class"})
		return
	}
	c.JSON(http.StatusCreated, class)
}

func GetClasses(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	var classes []models.Class
	database.DB.Where("teacher_id = ?", teacherID).Find(&classes)

	type classWithCount struct {
		models.Class
		MemberCount int64 `json:"member_count"`
	}
	result := make([]classWithCount, len(classes))
	for i, cl := range classes {
		var count int64
		database.DB.Model(&models.ClassMember{}).Where("class_id = ?", cl.ID).Count(&count)
		result[i] = classWithCount{Class: cl, MemberCount: count}
	}
	c.JSON(http.StatusOK, result)
}

func GetClass(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var class models.Class
	if err := database.DB.First(&class, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}
	if class.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your class"})
		return
	}

	var members []models.ClassMember
	database.DB.Where("class_id = ?", class.ID).Preload("User").Find(&members)

	c.JSON(http.StatusOK, gin.H{"class": class, "members": members})
}

func DeleteClass(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var class models.Class
	if err := database.DB.First(&class, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}
	if class.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your class"})
		return
	}

	database.DB.Where("class_id = ?", class.ID).Delete(&models.ClassMember{})
	database.DB.Where("class_id = ?", class.ID).Delete(&models.ExamClass{})
	database.DB.Delete(&class)

	c.JSON(http.StatusOK, gin.H{"message": "class deleted"})
}

func GetClassStats(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var class models.Class
	if err := database.DB.First(&class, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}
	if class.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your class"})
		return
	}

	var memberCount int64
	database.DB.Model(&models.ClassMember{}).Where("class_id = ?", class.ID).Count(&memberCount)

	var examCount int64
	database.DB.Model(&models.ExamClass{}).Where("class_id = ?", class.ID).Count(&examCount)

	// Get exam IDs for this class
	var examIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("class_id = ?", class.ID).Pluck("exam_id", &examIDs)

	var totalSubmissions int64
	var avgScore float64
	var passRate float64

	if len(examIDs) > 0 {
		database.DB.Model(&models.Submission{}).Where("exam_id IN ?", examIDs).Count(&totalSubmissions)

		var scoreResult struct{ Avg float64 }
		database.DB.Model(&models.Submission{}).
			Select("COALESCE(AVG(score), 0) as avg").
			Where("exam_id IN ?", examIDs).
			Scan(&scoreResult)
		avgScore = scoreResult.Avg

		if totalSubmissions > 0 {
			var passCount int64
			database.DB.Model(&models.Submission{}).
				Where("exam_id IN ? AND score >= 60", examIDs).
				Count(&passCount)
			passRate = float64(passCount) / float64(totalSubmissions) * 100
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"class":             class,
		"member_count":      memberCount,
		"exam_count":        examCount,
		"total_submissions": totalSubmissions,
		"avg_score":         avgScore,
		"pass_rate":         passRate,
	})
}
