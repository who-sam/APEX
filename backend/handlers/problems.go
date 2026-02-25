package handlers

import (
	"codejudge-backend/database"
	"codejudge-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type createProblemRequest struct {
	Title         string `json:"title" binding:"required"`
	Description   string `json:"description" binding:"required"`
	Difficulty    string `json:"difficulty"`
	StarterCode   string `json:"starter_code"`
	Hints         string `json:"hints"`
	TimeLimitMs   int    `json:"time_limit_ms"`
	MemoryLimitKb int    `json:"memory_limit_kb"`
	OrderIndex    int    `json:"order_index"`
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
		ExamID:        exam.ID,
		Title:         req.Title,
		Description:   req.Description,
		Difficulty:    req.Difficulty,
		StarterCode:   req.StarterCode,
		Hints:         req.Hints,
		TimeLimitMs:   req.TimeLimitMs,
		MemoryLimitKb: req.MemoryLimitKb,
		OrderIndex:    req.OrderIndex,
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

	if err := database.DB.Create(&problem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create problem"})
		return
	}

	c.JSON(http.StatusCreated, problem)
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
		"title":           req.Title,
		"description":     req.Description,
		"difficulty":      req.Difficulty,
		"starter_code":    req.StarterCode,
		"hints":           req.Hints,
		"time_limit_ms":   req.TimeLimitMs,
		"memory_limit_kb": req.MemoryLimitKb,
		"order_index":     req.OrderIndex,
	})

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

type createTestCaseRequest struct {
	Input          string `json:"input" binding:"required"`
	ExpectedOutput string `json:"expected_output" binding:"required"`
	IsSample       bool   `json:"is_sample"`
	OrderIndex     int    `json:"order_index"`
}

func AddTestCase(c *gin.Context) {
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

	var req createTestCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "input and expected_output are required"})
		return
	}

	tc := models.TestCase{
		ProblemID:      problem.ID,
		Input:          req.Input,
		ExpectedOutput: req.ExpectedOutput,
		IsSample:       req.IsSample,
		OrderIndex:     req.OrderIndex,
	}

	if err := database.DB.Create(&tc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create test case"})
		return
	}

	c.JSON(http.StatusCreated, tc)
}

func UpdateTestCase(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	tcID := c.Param("id")

	var tc models.TestCase
	if err := database.DB.First(&tc, tcID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test case not found"})
		return
	}

	var problem models.Problem
	if err := database.DB.First(&problem, tc.ProblemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", problem.ExamID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	var req createTestCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	database.DB.Model(&tc).Updates(map[string]any{
		"input":           req.Input,
		"expected_output": req.ExpectedOutput,
		"is_sample":       req.IsSample,
		"order_index":     req.OrderIndex,
	})

	c.JSON(http.StatusOK, tc)
}

func DeleteTestCase(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	tcID := c.Param("id")

	var tc models.TestCase
	if err := database.DB.First(&tc, tcID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test case not found"})
		return
	}

	var problem models.Problem
	if err := database.DB.First(&problem, tc.ProblemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", problem.ExamID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	database.DB.Delete(&tc)
	c.JSON(http.StatusOK, gin.H{"message": "test case deleted"})
}
