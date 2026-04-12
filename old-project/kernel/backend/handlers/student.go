package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetStudentExams(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Get class IDs via membership
	var classIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("user_id = ?", userID).Pluck("class_id", &classIDs)
	if len(classIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	// Get exam IDs via ExamClass
	var examIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("class_id IN ?", classIDs).Pluck("exam_id", &examIDs)
	if len(examIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	var exams []models.Exam
	database.DB.Where("id IN ?", examIDs).Find(&exams)

	now := time.Now()
	type examWithStatus struct {
		models.Exam
		Status       string `json:"status"`
		ProblemCount int64  `json:"problem_count"`
	}
	result := make([]examWithStatus, 0, len(exams))
	for _, e := range exams {
		status := "upcoming"
		if e.StartTime != nil && e.EndTime != nil {
			if now.After(*e.EndTime) {
				status = "completed"
			} else if now.After(*e.StartTime) {
				status = "active"
			}
		} else if e.StartTime != nil && now.After(*e.StartTime) {
			status = "active"
		}

		var pc int64
		database.DB.Model(&models.Problem{}).Where("exam_id = ?", e.ID).Count(&pc)
		result = append(result, examWithStatus{Exam: e, Status: status, ProblemCount: pc})
	}
	c.JSON(http.StatusOK, result)
}

func GetStudentExam(c *gin.Context) {
	userID := c.GetUint("user_id")
	id := c.Param("id")

	// Verify access via class membership
	var classIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("user_id = ?", userID).Pluck("class_id", &classIDs)

	var count int64
	if len(classIDs) > 0 {
		database.DB.Model(&models.ExamClass{}).Where("exam_id = ? AND class_id IN ?", id, classIDs).Count(&count)
	}
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "not enrolled in a class assigned to this exam"})
		return
	}

	var exam models.Exam
	if err := database.DB.
		Preload("Problems", func(db *gorm.DB) *gorm.DB { return db.Order("order_index ASC") }).
		Preload("Problems.TestCases", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_sample = ?", true).Order("order_index ASC")
		}).
		First(&exam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var submissions []models.Submission
	database.DB.Where("user_id = ? AND exam_id = ?", userID, id).Find(&submissions)

	c.JSON(http.StatusOK, gin.H{"exam": exam, "submissions": submissions})
}

func GetStudentPractice(c *gin.Context) {
	userID := c.GetUint("user_id")

	var classIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("user_id = ?", userID).Pluck("class_id", &classIDs)
	if len(classIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	var examIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("class_id IN ?", classIDs).Pluck("exam_id", &examIDs)
	if len(examIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	var exams []models.Exam
	database.DB.Where("id IN ? AND is_practice = ?", examIDs, true).Preload("Problems").Find(&exams)
	c.JSON(http.StatusOK, exams)
}
