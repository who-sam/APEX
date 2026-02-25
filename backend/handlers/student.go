package handlers

import (
	"codejudge-backend/database"
	"codejudge-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetStudentExams(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Get all class IDs the student belongs to
	var classIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("user_id = ?", userID).Pluck("class_id", &classIDs)

	if len(classIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	// Get all exam IDs assigned to those classes
	var examIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("class_id IN ?", classIDs).Pluck("exam_id", &examIDs)

	if len(examIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	var exams []models.Exam
	database.DB.Where("id IN ?", examIDs).
		Preload("ExamClasses.Class").
		Order("start_time asc").
		Find(&exams)

	now := time.Now()

	type ExamWithStatus struct {
		models.Exam
		Status       string `json:"status"`
		ProblemCount int64  `json:"problem_count"`
	}

	result := make([]ExamWithStatus, len(exams))
	for i, exam := range exams {
		status := "upcoming"
		if exam.StartTime != nil && exam.EndTime != nil {
			if now.After(*exam.EndTime) {
				status = "completed"
			} else if now.After(*exam.StartTime) {
				status = "active"
			}
		}
		var problemCount int64
		database.DB.Model(&models.Problem{}).Where("exam_id = ?", exam.ID).Count(&problemCount)
		result[i] = ExamWithStatus{Exam: exam, Status: status, ProblemCount: problemCount}
	}

	c.JSON(http.StatusOK, result)
}

func GetStudentExam(c *gin.Context) {
	userID := c.GetUint("user_id")
	examID := c.Param("id")

	// Verify student has access via class membership
	var classIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("user_id = ?", userID).Pluck("class_id", &classIDs)

	if len(classIDs) == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "not enrolled in any class"})
		return
	}

	var count int64
	database.DB.Model(&models.ExamClass{}).Where("exam_id = ? AND class_id IN ?", examID, classIDs).Count(&count)
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "exam not assigned to your class"})
		return
	}

	var exam models.Exam
	if err := database.DB.Where("id = ?", examID).
		Preload("Problems", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index asc")
		}).
		Preload("Problems.TestCases", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_sample = ?", true).Order("order_index asc")
		}).
		First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	// Get student's submissions for this exam
	var submissions []models.Submission
	database.DB.Where("user_id = ? AND exam_id = ?", userID, exam.ID).Find(&submissions)

	c.JSON(http.StatusOK, gin.H{
		"exam":        exam,
		"submissions": submissions,
	})
}
