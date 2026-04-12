package handlers

import (
	"kernel-backend/database"
	"kernel-backend/grading"
	"kernel-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func SubmitSolution(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req struct {
		ProblemID       uint   `json:"problem_id" binding:"required"`
		ExamID          uint   `json:"exam_id" binding:"required"`
		Type            string `json:"type"`
		Language        string `json:"language"`
		Code            string `json:"code"`
		SelectedOptions string `json:"selected_options"`
		TextAnswer      string `json:"text_answer"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem_id and exam_id are required"})
		return
	}

	// Verify exam hasn't ended
	var exam models.Exam
	if err := database.DB.First(&exam, req.ExamID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	if exam.EndTime != nil && time.Now().After(*exam.EndTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "exam has ended"})
		return
	}

	// Auto-detect type from problem if not provided
	var problem models.Problem
	if err := database.DB.First(&problem, req.ProblemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}
	subType := req.Type
	if subType == "" {
		subType = problem.Type
	}

	sub := models.Submission{
		UserID:          userID,
		ProblemID:       req.ProblemID,
		ExamID:          req.ExamID,
		Type:            subType,
		Language:        req.Language,
		Code:            req.Code,
		SelectedOptions: req.SelectedOptions,
		TextAnswer:      req.TextAnswer,
		Status:          "pending",
	}
	if err := database.DB.Create(&sub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create submission"})
		return
	}

	// Create notification
	database.DB.Create(&models.Notification{
		UserID:      userID,
		Type:        "submission",
		Title:       "Submission Received",
		Description: "Your submission for " + problem.Title + " is being processed",
	})

	// Dispatch grading
	switch subType {
	case "mcq":
		go grading.GradeMCQ(sub.ID)
	case "written":
		go grading.GradeWritten(sub.ID)
	default:
		go grading.Grade(sub.ID)
	}

	c.JSON(http.StatusCreated, sub)
}

func RunSolution(c *gin.Context) {
	var req struct {
		ProblemID uint   `json:"problem_id" binding:"required"`
		Language  string `json:"language" binding:"required"`
		Code      string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem_id, language, and code are required"})
		return
	}

	var testCases []models.TestCase
	database.DB.Where("problem_id = ? AND is_sample = ?", req.ProblemID, true).
		Order("order_index ASC").Find(&testCases)

	results := grading.RunAgainstTestCases(req.Code, req.Language, testCases)
	c.JSON(http.StatusOK, gin.H{"results": results})
}

func GetSubmission(c *gin.Context) {
	userID := c.GetUint("user_id")
	role, _ := c.Get("role")
	id := c.Param("id")

	var sub models.Submission
	if err := database.DB.Preload("TestResults").First(&sub, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
		return
	}

	// Access control: own submissions or teacher
	if sub.UserID != userID && role != "teacher" {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	// Enrich test results with sample info
	type enrichedResult struct {
		models.TestResult
		IsSample       bool   `json:"is_sample"`
		Input          string `json:"input,omitempty"`
		ExpectedOutput string `json:"expected_output,omitempty"`
	}
	enriched := make([]enrichedResult, 0, len(sub.TestResults))
	for _, tr := range sub.TestResults {
		var tc models.TestCase
		database.DB.First(&tc, tr.TestCaseID)
		er := enrichedResult{TestResult: tr, IsSample: tc.IsSample}
		if tc.IsSample || role == "teacher" {
			er.Input = tc.Input
			er.ExpectedOutput = tc.ExpectedOutput
		}
		enriched = append(enriched, er)
	}

	c.JSON(http.StatusOK, gin.H{"submission": sub, "test_results": enriched})
}

func GetStudentSubmissions(c *gin.Context) {
	userID := c.GetUint("user_id")
	var subs []models.Submission
	database.DB.Where("user_id = ?", userID).
		Preload("Problem").
		Order("submitted_at DESC").
		Find(&subs)
	c.JSON(http.StatusOK, subs)
}
