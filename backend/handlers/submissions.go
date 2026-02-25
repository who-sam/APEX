package handlers

import (
	"codejudge-backend/database"
	"codejudge-backend/grading"
	"codejudge-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type submitRequest struct {
	ProblemID uint   `json:"problem_id" binding:"required"`
	ExamID    uint   `json:"exam_id" binding:"required"`
	Language  string `json:"language" binding:"required"`
	Code      string `json:"code" binding:"required"`
}

func SubmitSolution(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req submitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem_id, exam_id, language, and code are required"})
		return
	}

	submission := models.Submission{
		UserID:    userID,
		ProblemID: req.ProblemID,
		ExamID:    req.ExamID,
		Language:  req.Language,
		Code:      req.Code,
		Status:    "pending",
	}

	if err := database.DB.Create(&submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create submission"})
		return
	}

	// Kick off grading asynchronously
	go grading.Grade(submission.ID)

	c.JSON(http.StatusCreated, submission)
}

type runRequest struct {
	ProblemID uint   `json:"problem_id" binding:"required"`
	Language  string `json:"language" binding:"required"`
	Code      string `json:"code" binding:"required"`
}

func RunSolution(c *gin.Context) {
	var req runRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem_id, language, and code are required"})
		return
	}

	// Get sample test cases only
	var testCases []models.TestCase
	database.DB.Where("problem_id = ? AND is_sample = ?", req.ProblemID, true).
		Order("order_index asc").
		Find(&testCases)

	if len(testCases) == 0 {
		c.JSON(http.StatusOK, gin.H{"results": []any{}, "message": "no sample test cases"})
		return
	}

	results := grading.RunAgainstTestCases(req.Code, req.Language, testCases)

	c.JSON(http.StatusOK, gin.H{"results": results})
}

func GetSubmission(c *gin.Context) {
	userID := c.GetUint("user_id")
	submissionID := c.Param("id")

	var submission models.Submission
	if err := database.DB.Where("id = ?", submissionID).
		Preload("TestResults").
		First(&submission).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
		return
	}

	// Users can only see their own submissions (unless teacher — handled separately)
	role, _ := c.Get("role")
	if role.(string) != "teacher" && submission.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	// Get test cases to determine which are sample
	var testCases []models.TestCase
	database.DB.Where("problem_id = ?", submission.ProblemID).Find(&testCases)
	sampleMap := make(map[uint]bool)
	for _, tc := range testCases {
		sampleMap[tc.ID] = tc.IsSample
	}

	type ResultView struct {
		models.TestResult
		IsSample       bool   `json:"is_sample"`
		Input          string `json:"input,omitempty"`
		ExpectedOutput string `json:"expected_output,omitempty"`
	}

	viewResults := make([]ResultView, len(submission.TestResults))
	for i, tr := range submission.TestResults {
		rv := ResultView{TestResult: tr, IsSample: sampleMap[tr.TestCaseID]}
		if rv.IsSample {
			// Include full details for sample test cases
			var tc models.TestCase
			database.DB.First(&tc, tr.TestCaseID)
			rv.Input = tc.Input
			rv.ExpectedOutput = tc.ExpectedOutput
		}
		viewResults[i] = rv
	}

	c.JSON(http.StatusOK, gin.H{
		"submission":   submission,
		"test_results": viewResults,
	})
}

func GetStudentSubmissions(c *gin.Context) {
	userID := c.GetUint("user_id")

	var submissions []models.Submission
	database.DB.Where("user_id = ?", userID).
		Preload("Problem").
		Order("submitted_at desc").
		Find(&submissions)

	c.JSON(http.StatusOK, submissions)
}
