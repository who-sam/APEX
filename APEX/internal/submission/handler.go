package submission

import (
	"apex/internal/database"
	"apex/internal/judge0"
	"apex/internal/models"
	"apex/internal/notification"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type submitRequest struct {
	ProblemID       uint   `json:"problem_id" binding:"required"`
	ExamID          uint   `json:"exam_id" binding:"required"`
	Type            string `json:"type"`
	Language        string `json:"language"`
	Code            string `json:"code"`
	SelectedOptions string `json:"selected_options"`
	TextAnswer      string `json:"text_answer"`
}

func SubmitSolution(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req submitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem_id and exam_id are required"})
		return
	}

	// Validate exam exists
	var exam models.Exam
	if err := database.DB.First(&exam, req.ExamID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	// FIX: validate start_time — reject if exam hasn't started
	if exam.StartTime != nil && time.Now().Before(*exam.StartTime) {
		c.JSON(http.StatusForbidden, gin.H{"error": "exam has not started yet"})
		return
	}
	if exam.EndTime != nil && time.Now().After(*exam.EndTime) {
		c.JSON(http.StatusForbidden, gin.H{"error": "exam has ended"})
		return
	}

	// FIX: verify enrollment via ClassMember→ExamClass
	var classIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("user_id = ?", userID).Pluck("class_id", &classIDs)
	if len(classIDs) == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "not enrolled in any class"})
		return
	}
	var enrolledCount int64
	database.DB.Model(&models.ExamClass{}).Where("exam_id = ? AND class_id IN ?", req.ExamID, classIDs).Count(&enrolledCount)
	if enrolledCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "exam not assigned to your class"})
		return
	}

	// Look up problem type if not provided
	submissionType := req.Type
	if submissionType == "" {
		var problem models.Problem
		if err := database.DB.First(&problem, req.ProblemID).Error; err == nil {
			submissionType = problem.Type
		}
		if submissionType == "" {
			submissionType = "coding"
		}
	}

	selectedOptions := req.SelectedOptions
	if selectedOptions == "" {
		selectedOptions = "null"
	}

	sub := models.Submission{
		UserID:          userID,
		ProblemID:       req.ProblemID,
		ExamID:          req.ExamID,
		Type:            submissionType,
		Language:        req.Language,
		Code:            req.Code,
		SelectedOptions: selectedOptions,
		TextAnswer:      req.TextAnswer,
		Status:          "pending",
	}

	if err := database.DB.Create(&sub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create submission"})
		return
	}

	notification.Create(userID, "submission",
		"Submission Received",
		"Your submission is being processed.",
		"/dashboard/results",
	)

	switch submissionType {
	case "mcq":
		go judge0.GradeMCQ(sub.ID)
	case "written":
		go judge0.GradeWritten(sub.ID)
	default:
		go judge0.Grade(sub.ID)
	}

	c.JSON(http.StatusCreated, sub)
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

	var testCases []models.TestCase
	database.DB.Where("problem_id = ? AND is_sample = ?", req.ProblemID, true).
		Order("order_index asc").
		Find(&testCases)

	if len(testCases) == 0 {
		c.JSON(http.StatusOK, gin.H{"results": []any{}, "message": "no sample test cases"})
		return
	}

	results := judge0.RunAgainstTestCases(req.Code, req.Language, testCases)
	c.JSON(http.StatusOK, gin.H{"results": results})
}

type gradeRequest struct {
	Score           float64 `json:"score" binding:"required"`
	Status          string  `json:"status" binding:"required"`
	TeacherFeedback *string `json:"teacher_feedback"`
}

func GradeSubmission(c *gin.Context) {
	submissionID := c.Param("id")

	var req gradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "score and status are required"})
		return
	}

	var sub models.Submission
	if err := database.DB.First(&sub, submissionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
		return
	}

	sub.Score = req.Score
	sub.Status = req.Status
	sub.PassedCount = int(req.Score)
	sub.TotalCount = 100
	if req.TeacherFeedback != nil {
		sub.TeacherFeedback = *req.TeacherFeedback
	}

	if err := database.DB.Save(&sub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update submission"})
		return
	}

	if sub.ExamAttemptID != nil {
		judge0.FinalizeAttempt(*sub.ExamAttemptID)
	}

	notification.Create(sub.UserID, "result",
		"Submission Graded",
		"Your written submission has been graded.",
		"/dashboard/results",
	)

	c.JSON(http.StatusOK, sub)
}

func GetSubmission(c *gin.Context) {
	userID := c.GetUint("user_id")
	submissionID := c.Param("id")

	var sub models.Submission
	if err := database.DB.Where("id = ?", submissionID).
		Preload("TestResults").
		First(&sub).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
		return
	}

	role, _ := c.Get("role")
	roleStr, _ := role.(string)
	if roleStr != "teacher" && sub.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	var testCases []models.TestCase
	database.DB.Where("problem_id = ?", sub.ProblemID).Find(&testCases)
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

	viewResults := make([]ResultView, len(sub.TestResults))
	for i, tr := range sub.TestResults {
		rv := ResultView{TestResult: tr, IsSample: sampleMap[tr.TestCaseID]}
		if rv.IsSample {
			var tc models.TestCase
			database.DB.First(&tc, tr.TestCaseID)
			rv.Input = tc.Input
			rv.ExpectedOutput = tc.ExpectedOutput
		}
		viewResults[i] = rv
	}

	c.JSON(http.StatusOK, gin.H{
		"submission":   sub,
		"test_results": viewResults,
	})
}
