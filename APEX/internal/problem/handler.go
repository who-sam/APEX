package problem

import (
	"apex/internal/database"
	examsvc "apex/internal/exam"
	"apex/internal/models"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func verifyFolderOwnership(folderID *uint, teacherID uint) error {
	if folderID == nil {
		return nil
	}
	var count int64
	if err := database.DB.Model(&models.Folder{}).
		Where("id = ? AND teacher_id = ?", *folderID, teacherID).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return errors.New("folder not found or not authorized")
	}
	return nil
}

type createProblemRequest struct {
	Title                string `json:"title" binding:"required"`
	Description          string `json:"description" binding:"required"`
	Type                 string `json:"type"`
	Points               int    `json:"points"`
	Difficulty           string `json:"difficulty"`
	StarterCode          string `json:"starter_code"`
	Hints                string `json:"hints"`
	TimeLimitMs          int    `json:"time_limit_ms"`
	MemoryLimitKb        int    `json:"memory_limit_kb"`
	OrderIndex           int    `json:"order_index"`
	Options              string `json:"options"`
	CorrectOptionIDs     string `json:"correct_option_ids"`
	MultipleCorrect      bool   `json:"multiple_correct"`
	Explanation          string `json:"explanation"`
	MaxWordCount         int    `json:"max_word_count"`
	Rubric               string `json:"rubric"`
	RequireManualGrading bool   `json:"require_manual_grading"`
	Tags                 string `json:"tags"`
	ExamID               *uint  `json:"exam_id,omitempty"`
	ClassID              *uint  `json:"class_id,omitempty"`
	FolderID             *uint  `json:"folder_id,omitempty"`
}

func AddProblem(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var req createProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title and description are required"})
		return
	}

	options := req.Options
	if options == "" || options == "null" {
		options = "[]"
	}
	correctOptionIDs := req.CorrectOptionIDs
	if correctOptionIDs == "" || correctOptionIDs == "null" {
		correctOptionIDs = "[]"
	}

	eid := exam.ID
	problem := models.Problem{
		ExamID:               &eid,
		TeacherID:            teacherID,
		Title:                req.Title,
		Description:          req.Description,
		Type:                 req.Type,
		Points:               req.Points,
		Difficulty:           req.Difficulty,
		StarterCode:          req.StarterCode,
		Hints:                req.Hints,
		TimeLimitMs:          req.TimeLimitMs,
		MemoryLimitKb:        req.MemoryLimitKb,
		OrderIndex:           req.OrderIndex,
		Options:              options,
		CorrectOptionIDs:     correctOptionIDs,
		MultipleCorrect:      req.MultipleCorrect,
		Explanation:          req.Explanation,
		MaxWordCount:         req.MaxWordCount,
		Rubric:               req.Rubric,
		RequireManualGrading: req.RequireManualGrading,
		Tags:                 req.Tags,
	}
	if problem.Tags == "" {
		problem.Tags = "[]"
	}
	if problem.Type == "" {
		problem.Type = "coding"
	}
	if problem.Points == 0 {
		problem.Points = 10
	}
	if problem.Difficulty == "" {
		problem.Difficulty = "medium"
	}
	if problem.TimeLimitMs == 0 {
		problem.TimeLimitMs = 2000
	}
	if problem.MemoryLimitKb == 0 {
		problem.MemoryLimitKb = 262144
	}
	if problem.MaxWordCount == 0 {
		problem.MaxWordCount = 500
	}

	if err := database.DB.Create(&problem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create problem"})
		return
	}

	c.JSON(http.StatusCreated, problem)
}

func GetAllProblems(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	var problems []models.Problem
	database.DB.Where("is_bank = ? AND teacher_id = ?", true, teacherID).
		Preload("TestCases").
		Order("created_at desc").
		Find(&problems)

	c.JSON(http.StatusOK, problems)
}

func AddBankProblem(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	var req createProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title and description are required"})
		return
	}

	options := req.Options
	if options == "" || options == "null" {
		options = "[]"
	}
	correctOptionIDs := req.CorrectOptionIDs
	if correctOptionIDs == "" || correctOptionIDs == "null" {
		correctOptionIDs = "[]"
	}

	if err := verifyFolderOwnership(req.FolderID, teacherID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	problem := models.Problem{
		IsBank:               true,
		ExamID:               nil,
		ClassID:              req.ClassID,
		FolderID:             req.FolderID,
		TeacherID:            teacherID,
		Title:                req.Title,
		Description:          req.Description,
		Type:                 req.Type,
		Points:               req.Points,
		Difficulty:           req.Difficulty,
		StarterCode:          req.StarterCode,
		Hints:                req.Hints,
		TimeLimitMs:          req.TimeLimitMs,
		MemoryLimitKb:        req.MemoryLimitKb,
		OrderIndex:           req.OrderIndex,
		Options:              options,
		CorrectOptionIDs:     correctOptionIDs,
		MultipleCorrect:      req.MultipleCorrect,
		Explanation:          req.Explanation,
		MaxWordCount:         req.MaxWordCount,
		Rubric:               req.Rubric,
		RequireManualGrading: req.RequireManualGrading,
		Tags:                 req.Tags,
	}
	if problem.Tags == "" {
		problem.Tags = "[]"
	}
	if problem.Type == "" {
		problem.Type = "coding"
	}
	if problem.Points == 0 {
		problem.Points = 10
	}
	if problem.Difficulty == "" {
		problem.Difficulty = "medium"
	}
	if problem.TimeLimitMs == 0 {
		problem.TimeLimitMs = 2000
	}
	if problem.MemoryLimitKb == 0 {
		problem.MemoryLimitKb = 262144
	}
	if problem.MaxWordCount == 0 {
		problem.MaxWordCount = 500
	}

	if err := database.DB.Create(&problem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save to bank"})
		return
	}

	c.JSON(http.StatusCreated, problem)
}

func GetProblem(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	problemID := c.Param("id")

	var problem models.Problem
	if err := database.DB.Preload("TestCases", func(db *gorm.DB) *gorm.DB {
		return db.Order("order_index asc")
	}).First(&problem, problemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}

	if problem.IsBank || problem.ExamID == nil {
		if problem.TeacherID != teacherID {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
	} else {
		var exam models.Exam
		if err := database.DB.Where("id = ? AND teacher_id = ?", problem.ExamID, teacherID).First(&exam).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
	}

	c.JSON(http.StatusOK, problem)
}

func UpdateProblem(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	problemID := c.Param("id")

	var problem models.Problem
	if err := database.DB.First(&problem, problemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}

	// Authorize: bank problems belong to teacher directly; exam problems via exam ownership
	if problem.IsBank {
		if problem.TeacherID != teacherID {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
	} else {
		var exam models.Exam
		if err := database.DB.Where("id = ? AND teacher_id = ?", problem.ExamID, teacherID).First(&exam).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
	}

	var req createProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	options := req.Options
	if options == "" || options == "null" {
		options = "[]"
	}
	correctOptionIDs := req.CorrectOptionIDs
	if correctOptionIDs == "" || correctOptionIDs == "null" {
		correctOptionIDs = "[]"
	}
	tags := req.Tags
	if tags == "" || tags == "null" {
		tags = "[]"
	}

	if err := verifyFolderOwnership(req.FolderID, teacherID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]any{
		"title":                  req.Title,
		"description":            req.Description,
		"type":                   req.Type,
		"points":                 req.Points,
		"difficulty":             req.Difficulty,
		"starter_code":           req.StarterCode,
		"hints":                  req.Hints,
		"time_limit_ms":          req.TimeLimitMs,
		"memory_limit_kb":        req.MemoryLimitKb,
		"order_index":            req.OrderIndex,
		"options":                options,
		"correct_option_ids":     correctOptionIDs,
		"multiple_correct":       req.MultipleCorrect,
		"explanation":            req.Explanation,
		"max_word_count":         req.MaxWordCount,
		"rubric":                 req.Rubric,
		"require_manual_grading": req.RequireManualGrading,
		"tags":                   tags,
		"class_id":               req.ClassID,
		"folder_id":              req.FolderID,
	}
	if req.ExamID != nil && !problem.IsBank {
		// Verify teacher owns the target exam (only for exam problems)
		var targetExam models.Exam
		if err := database.DB.Where("id = ? AND teacher_id = ?", *req.ExamID, teacherID).First(&targetExam).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "target exam not found or not authorized"})
			return
		}
		updates["exam_id"] = *req.ExamID
	}
	// If MCQ answer key changed on an exam problem, any student submissions
	// were graded against the old key — reset attempts so students re-take.
	mcqKeyChanged := !problem.IsBank && problem.ExamID != nil &&
		problem.Type == "mcq" && problem.CorrectOptionIDs != correctOptionIDs
	database.DB.Model(&problem).Updates(updates)
	if mcqKeyChanged {
		_ = examsvc.ResetExamAttempts(*problem.ExamID)
	}

	database.DB.Preload("TestCases", func(db *gorm.DB) *gorm.DB {
		return db.Order("order_index asc")
	}).First(&problem, problemID)

	c.JSON(http.StatusOK, problem)
}

func DeleteProblem(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	problemID := c.Param("id")

	var problem models.Problem
	if err := database.DB.First(&problem, problemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}

	if problem.IsBank || problem.ExamID == nil {
		if problem.TeacherID != teacherID {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
	} else {
		var exam models.Exam
		if err := database.DB.Where("id = ? AND teacher_id = ?", problem.ExamID, teacherID).First(&exam).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
	}

	tx := database.DB.Begin()

	// Delete test_results referencing submissions on this problem
	var subIDs []uint
	tx.Model(&models.Submission{}).Where("problem_id = ?", problem.ID).Pluck("id", &subIDs)
	if len(subIDs) > 0 {
		if err := tx.Where("submission_id IN ?", subIDs).Delete(&models.TestResult{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete test results"})
			return
		}
	}
	if err := tx.Where("problem_id = ?", problem.ID).Delete(&models.Submission{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete submissions"})
		return
	}
	if err := tx.Where("problem_id = ?", problem.ID).Delete(&models.TestCase{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete test cases"})
		return
	}
	if err := tx.Delete(&problem).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete problem"})
		return
	}
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to commit"})
		return
	}

	// Destructive structural change — reset remaining attempts + notify.
	if !problem.IsBank && problem.ExamID != nil {
		_ = examsvc.ResetExamAttempts(*problem.ExamID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "problem deleted"})
}
