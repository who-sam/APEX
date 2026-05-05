package submission

import (
	"apex/internal/database"
	"apex/internal/judge0"
	"apex/internal/models"
	"apex/internal/notification"
	"net/http"

	"github.com/gin-gonic/gin"
)

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

	var problem models.Problem
	if err := database.DB.Select("id", "exam_id", "teacher_id").First(&problem, req.ProblemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}

	userID := c.GetUint("user_id")
	role, _ := c.Get("role")
	roleStr, _ := role.(string)
	if roleStr == "teacher" {
		if problem.TeacherID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
	} else {
		if problem.ExamID == nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
		var assigned int64
		database.DB.Model(&models.ExamClass{}).
			Joins("JOIN class_members ON class_members.class_id = exam_classes.class_id").
			Where("exam_classes.exam_id = ? AND class_members.user_id = ?", *problem.ExamID, userID).
			Count(&assigned)
		if assigned == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
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
	teacherID := c.GetUint("user_id")
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

	// Verify the teacher owns the exam this submission belongs to.
	var exam models.Exam
	if err := database.DB.Select("id", "teacher_id").First(&exam, sub.ExamID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	if exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized to grade this submission"})
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
	} else {
		// Standalone (non-exam) submissions still get per-submission notification.
		notification.Create(sub.UserID, "result",
			"Submission Graded",
			"Your written submission has been graded.",
			"/dashboard/results",
		)
	}

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
	if roleStr == "teacher" {
		// Teachers may only read submissions on exams they own.
		var exam models.Exam
		if err := database.DB.Select("id", "teacher_id").First(&exam, sub.ExamID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
			return
		}
		if exam.TeacherID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
			return
		}
	} else if sub.UserID != userID {
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
