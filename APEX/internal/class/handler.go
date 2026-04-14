package class

import (
	"apex/internal/database"
	"apex/internal/models"
	"crypto/rand"
	"math/big"
	"net/http"

	"github.com/gin-gonic/gin"
)

const inviteCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func generateInviteCode() string {
	code := make([]byte, 8)
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

type updateClassRequest struct {
	Name       *string `json:"name"`
	Section    *string `json:"section"`
	CoverImage *string `json:"cover_image"`
}

func UpdateClass(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	var req updateClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Section != nil {
		updates["section"] = *req.Section
	}
	if req.CoverImage != nil {
		updates["cover_image"] = *req.CoverImage
	}

	if len(updates) > 0 {
		database.DB.Model(&class).Updates(updates)
	}

	database.DB.First(&class, class.ID)
	c.JSON(http.StatusOK, class)
}

func DeleteClass(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	tx := database.DB.Begin()
	if err := tx.Where("class_id = ?", classID).Delete(&models.ClassMember{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete class members"})
		return
	}
	if err := tx.Where("class_id = ?", classID).Delete(&models.ExamClass{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete exam-class links"})
		return
	}
	if err := tx.Delete(&class).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete class"})
		return
	}
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to commit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "class deleted"})
}

func GetClassStats(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	var memberIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("class_id = ?", class.ID).Pluck("user_id", &memberIDs)

	var examIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("class_id = ?", class.ID).Pluck("exam_id", &examIDs)

	var totalSubmissions int64
	var avgScore float64
	var passCount int64

	if len(memberIDs) > 0 && len(examIDs) > 0 {
		database.DB.Model(&models.Submission{}).
			Where("user_id IN ? AND exam_id IN ?", memberIDs, examIDs).
			Count(&totalSubmissions)

		if totalSubmissions > 0 {
			var scoreSum float64
			database.DB.Model(&models.Submission{}).
				Where("user_id IN ? AND exam_id IN ?", memberIDs, examIDs).
				Select("COALESCE(SUM(score), 0)").
				Scan(&scoreSum)
			avgScore = scoreSum / float64(totalSubmissions)

			database.DB.Model(&models.Submission{}).
				Where("user_id IN ? AND exam_id IN ? AND status = ?", memberIDs, examIDs, "accepted").
				Count(&passCount)
		}
	}

	passRate := 0.0
	if totalSubmissions > 0 {
		passRate = float64(passCount) / float64(totalSubmissions) * 100.0
	}

	c.JSON(http.StatusOK, gin.H{
		"class":             class,
		"member_count":      len(memberIDs),
		"exam_count":        len(examIDs),
		"total_submissions": totalSubmissions,
		"avg_score":         avgScore,
		"pass_rate":         passRate,
	})
}

func RemoveClassMember(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")
	userID := c.Param("userId")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	result := database.DB.Where("class_id = ? AND user_id = ?", class.ID, userID).Delete(&models.ClassMember{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove member"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "member not found in class"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "member removed"})
}
