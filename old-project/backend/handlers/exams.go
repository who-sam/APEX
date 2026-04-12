package handlers

import (
	"codejudge-backend/database"
	"codejudge-backend/models"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type createExamRequest struct {
	Title            string `json:"title" binding:"required"`
	Description      string `json:"description"`
	DurationMinutes  int    `json:"duration_minutes"`
	StartTime        string `json:"start_time"`
	EndTime          string `json:"end_time"`
	ShuffleQuestions bool   `json:"shuffle_questions"`
	ShowResultsAfter bool   `json:"show_results_after"`
	PassingScore     int    `json:"passing_score"`
	IsPractice       bool   `json:"is_practice"`
}

func CreateExam(c *gin.Context) {
	var req createExamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}

	teacherID := c.GetUint("user_id")

	exam := models.Exam{
		TeacherID:        teacherID,
		Title:            req.Title,
		Description:      req.Description,
		DurationMinutes:  req.DurationMinutes,
		ShuffleQuestions: req.ShuffleQuestions,
		ShowResultsAfter: req.ShowResultsAfter,
		PassingScore:     req.PassingScore,
		IsPractice:       req.IsPractice,
	}
	if exam.DurationMinutes == 0 {
		exam.DurationMinutes = 60
	}
	if exam.PassingScore == 0 {
		exam.PassingScore = 50
	}

	if req.StartTime != "" {
		t, err := parseTime(req.StartTime)
		if err == nil {
			exam.StartTime = &t
		}
	}
	if req.EndTime != "" {
		t, err := parseTime(req.EndTime)
		if err == nil {
			exam.EndTime = &t
		}
	}

	if err := database.DB.Create(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create exam"})
		return
	}

	c.JSON(http.StatusCreated, exam)
}

func GetExams(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	var exams []models.Exam
	database.DB.Where("teacher_id = ?", teacherID).
		Preload("ExamClasses").
		Order("created_at desc").
		Find(&exams)

	type ExamWithMeta struct {
		models.Exam
		ProblemCount int64 `json:"problem_count"`
		ClassCount   int   `json:"class_count"`
	}

	result := make([]ExamWithMeta, len(exams))
	for i, exam := range exams {
		var problemCount int64
		database.DB.Model(&models.Problem{}).Where("exam_id = ?", exam.ID).Count(&problemCount)
		result[i] = ExamWithMeta{
			Exam:         exam,
			ProblemCount: problemCount,
			ClassCount:   len(exam.ExamClasses),
		}
	}

	c.JSON(http.StatusOK, result)
}

func GetExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).
		Preload("Problems", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index asc")
		}).
		Preload("Problems.TestCases", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index asc")
		}).
		Preload("ExamClasses.Class").
		First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	c.JSON(http.StatusOK, exam)
}

func UpdateExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var req createExamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	updates := map[string]any{
		"title":             req.Title,
		"description":       req.Description,
		"shuffle_questions": req.ShuffleQuestions,
		"show_results_after": req.ShowResultsAfter,
		"is_practice":       req.IsPractice,
	}
	if req.DurationMinutes > 0 {
		updates["duration_minutes"] = req.DurationMinutes
	}
	if req.PassingScore > 0 {
		updates["passing_score"] = req.PassingScore
	}
	if req.StartTime != "" {
		if t, err := parseTime(req.StartTime); err == nil {
			updates["start_time"] = t
		}
	}
	if req.EndTime != "" {
		if t, err := parseTime(req.EndTime); err == nil {
			updates["end_time"] = t
		}
	}

	database.DB.Model(&exam).Updates(updates)

	c.JSON(http.StatusOK, exam)
}

func DeleteExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	result := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).Delete(&models.Exam{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var problemIDs []uint
	database.DB.Model(&models.Problem{}).Where("exam_id = ?", examID).Pluck("id", &problemIDs)
	if len(problemIDs) > 0 {
		database.DB.Where("problem_id IN ?", problemIDs).Delete(&models.TestCase{})
	}
	database.DB.Where("exam_id = ?", examID).Delete(&models.Problem{})
	database.DB.Where("exam_id = ?", examID).Delete(&models.ExamClass{})

	c.JSON(http.StatusOK, gin.H{"message": "exam deleted"})
}

type assignExamRequest struct {
	ClassIDs []uint `json:"class_ids" binding:"required"`
}

func AssignExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var req assignExamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "class_ids is required"})
		return
	}

	database.DB.Where("exam_id = ?", exam.ID).Delete(&models.ExamClass{})

	for _, classID := range req.ClassIDs {
		ec := models.ExamClass{ExamID: exam.ID, ClassID: classID}
		database.DB.Create(&ec)
	}

	c.JSON(http.StatusOK, gin.H{"message": "exam assigned to classes"})
}

func parseTime(s string) (time.Time, error) {
	layouts := []string{
		time.RFC3339,
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
		"2006-01-02T15:04",
		"2006-01-02",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unable to parse time: %s", s)
}
