package problem

import (
	"apex/internal/database"
	"apex/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

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

	problem := models.Problem{
		ExamID:               exam.ID,
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
		Options:              req.Options,
		CorrectOptionIDs:     req.CorrectOptionIDs,
		MultipleCorrect:      req.MultipleCorrect,
		Explanation:          req.Explanation,
		MaxWordCount:         req.MaxWordCount,
		Rubric:               req.Rubric,
		RequireManualGrading: req.RequireManualGrading,
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

	var examIDs []uint
	database.DB.Model(&models.Exam{}).Where("teacher_id = ?", teacherID).Pluck("id", &examIDs)

	if len(examIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	var problems []models.Problem
	database.DB.Where("exam_id IN ?", examIDs).
		Preload("TestCases").
		Order("created_at desc").
		Find(&problems)

	c.JSON(http.StatusOK, problems)
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

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", problem.ExamID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
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

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", problem.ExamID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	var req createProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	database.DB.Model(&problem).Updates(map[string]any{
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
		"options":                req.Options,
		"correct_option_ids":     req.CorrectOptionIDs,
		"multiple_correct":       req.MultipleCorrect,
		"explanation":            req.Explanation,
		"max_word_count":         req.MaxWordCount,
		"rubric":                 req.Rubric,
		"require_manual_grading": req.RequireManualGrading,
	})

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

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", problem.ExamID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	database.DB.Where("problem_id = ?", problem.ID).Delete(&models.TestCase{})
	database.DB.Delete(&problem)

	c.JSON(http.StatusOK, gin.H{"message": "problem deleted"})
}
