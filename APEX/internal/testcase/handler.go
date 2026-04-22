package testcase

import (
	"apex/internal/database"
	examsvc "apex/internal/exam"
	"apex/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

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

	if !problem.IsBank && problem.ExamID != nil {
		_ = examsvc.ResetExamAttempts(*problem.ExamID)
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

	var req createTestCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	expectedChanged := tc.ExpectedOutput != req.ExpectedOutput || tc.Input != req.Input
	database.DB.Model(&tc).Updates(map[string]any{
		"input":           req.Input,
		"expected_output": req.ExpectedOutput,
		"is_sample":       req.IsSample,
		"order_index":     req.OrderIndex,
	})

	if expectedChanged && !problem.IsBank && problem.ExamID != nil {
		_ = examsvc.ResetExamAttempts(*problem.ExamID)
	}

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

	database.DB.Delete(&tc)

	if !problem.IsBank && problem.ExamID != nil {
		_ = examsvc.ResetExamAttempts(*problem.ExamID)
	}

	c.JSON(http.StatusOK, gin.H{"message": "test case deleted"})
}
