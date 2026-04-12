package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var timeFormats = []string{
	time.RFC3339,
	"2006-01-02T15:04:05",
	"2006-01-02T15:04",
	"2006-01-02",
}

func parseTime(s string) (*time.Time, error) {
	if s == "" {
		return nil, nil
	}
	for _, f := range timeFormats {
		if t, err := time.Parse(f, s); err == nil {
			return &t, nil
		}
	}
	return nil, &time.ParseError{}
}

func CreateExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	var req struct {
		Title            string `json:"title" binding:"required"`
		Description      string `json:"description"`
		DurationMinutes  *int   `json:"duration_minutes"`
		StartTime        string `json:"start_time"`
		EndTime          string `json:"end_time"`
		ShuffleQuestions *bool  `json:"shuffle_questions"`
		ShowResultsAfter *bool  `json:"show_results_after"`
		PassingScore     *int   `json:"passing_score"`
		IsPractice       *bool  `json:"is_practice"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}
	if len(req.Title) > 255 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title must be at most 255 characters"})
		return
	}
	if len(req.Description) > 5000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "description must be at most 5000 characters"})
		return
	}

	exam := models.Exam{
		TeacherID:        teacherID,
		Title:            req.Title,
		Description:      req.Description,
		DurationMinutes:  60,
		ShowResultsAfter: true,
		PassingScore:     50,
	}

	if req.DurationMinutes != nil {
		if *req.DurationMinutes < 1 || *req.DurationMinutes > 600 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "duration must be between 1 and 600 minutes"})
			return
		}
		exam.DurationMinutes = *req.DurationMinutes
	}
	if req.PassingScore != nil {
		if *req.PassingScore < 0 || *req.PassingScore > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "passing score must be between 0 and 100"})
			return
		}
		exam.PassingScore = *req.PassingScore
	}
	if req.ShuffleQuestions != nil {
		exam.ShuffleQuestions = *req.ShuffleQuestions
	}
	if req.ShowResultsAfter != nil {
		exam.ShowResultsAfter = *req.ShowResultsAfter
	}
	if req.IsPractice != nil {
		exam.IsPractice = *req.IsPractice
	}

	startTime, err := parseTime(req.StartTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_time format"})
		return
	}
	exam.StartTime = startTime

	endTime, err := parseTime(req.EndTime)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_time format"})
		return
	}
	exam.EndTime = endTime

	if err := database.DB.Create(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create exam"})
		return
	}
	c.JSON(http.StatusCreated, exam)
}

func GetExams(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	var exams []models.Exam
	database.DB.Where("teacher_id = ?", teacherID).Preload("ExamClasses").Find(&exams)

	type examWithCounts struct {
		models.Exam
		ProblemCount int64 `json:"problem_count"`
		ClassCount   int   `json:"class_count"`
	}
	result := make([]examWithCounts, len(exams))
	for i, e := range exams {
		var pc int64
		database.DB.Model(&models.Problem{}).Where("exam_id = ?", e.ID).Count(&pc)
		result[i] = examWithCounts{Exam: e, ProblemCount: pc, ClassCount: len(e.ExamClasses)}
	}
	c.JSON(http.StatusOK, result)
}

func GetExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var exam models.Exam
	if err := database.DB.
		Preload("Problems", func(db *gorm.DB) *gorm.DB { return db.Order("order_index ASC") }).
		Preload("Problems.TestCases", func(db *gorm.DB) *gorm.DB { return db.Order("order_index ASC") }).
		Preload("ExamClasses.Class").
		First(&exam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	if exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your exam"})
		return
	}
	c.JSON(http.StatusOK, exam)
}

func UpdateExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var exam models.Exam
	if err := database.DB.First(&exam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	if exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your exam"})
		return
	}

	var updates map[string]any
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Parse time fields if present
	for _, field := range []string{"start_time", "end_time"} {
		if v, ok := updates[field]; ok {
			if s, ok := v.(string); ok && s != "" {
				t, err := parseTime(s)
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "invalid " + field + " format"})
					return
				}
				updates[field] = t
			}
		}
	}

	database.DB.Model(&exam).Updates(updates)
	database.DB.First(&exam, id)
	c.JSON(http.StatusOK, exam)
}

func DeleteExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var exam models.Exam
	if err := database.DB.First(&exam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	if exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your exam"})
		return
	}

	// Cascade delete
	var problemIDs []uint
	database.DB.Model(&models.Problem{}).Where("exam_id = ?", exam.ID).Pluck("id", &problemIDs)
	if len(problemIDs) > 0 {
		database.DB.Where("problem_id IN ?", problemIDs).Delete(&models.TestCase{})
	}
	database.DB.Where("exam_id = ?", exam.ID).Delete(&models.Problem{})
	database.DB.Where("exam_id = ?", exam.ID).Delete(&models.ExamClass{})
	database.DB.Delete(&exam)

	c.JSON(http.StatusOK, gin.H{"message": "exam deleted"})
}

func AssignExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var exam models.Exam
	if err := database.DB.First(&exam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	if exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your exam"})
		return
	}

	var req struct {
		ClassIDs []uint `json:"class_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "class_ids is required"})
		return
	}

	database.DB.Where("exam_id = ?", exam.ID).Delete(&models.ExamClass{})
	for _, cid := range req.ClassIDs {
		database.DB.Create(&models.ExamClass{ExamID: exam.ID, ClassID: cid})
	}

	c.JSON(http.StatusOK, gin.H{"message": "exam assigned to classes"})
}
