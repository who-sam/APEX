package exam

import (
	"apex/internal/database"
	"apex/internal/judge0"
	"apex/internal/models"
	"apex/internal/notification"
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
	IsDraft          *bool  `json:"is_draft"`
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
		IsDraft:          true,
	}
	if req.IsDraft != nil {
		exam.IsDraft = *req.IsDraft
	}
	if exam.DurationMinutes == 0 {
		exam.DurationMinutes = 60
	}
	if exam.PassingScore == 0 {
		exam.PassingScore = 50
	}

	if req.StartTime != "" {
		if t, err := parseTime(req.StartTime); err == nil {
			exam.StartTime = &t
		}
	}
	if req.EndTime != "" {
		if t, err := parseTime(req.EndTime); err == nil {
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
		ProblemCount    int64  `json:"problem_count"`
		ClassCount      int    `json:"class_count"`
		Status          string `json:"status"`
		SubmissionCount int64  `json:"submission_count"`
		StudentCount    int64  `json:"student_count"`
	}

	now := time.Now()
	result := make([]ExamWithMeta, len(exams))
	for i, e := range exams {
		var problemCount int64
		database.DB.Model(&models.Problem{}).Where("exam_id = ?", e.ID).Count(&problemCount)

		var submissionCount int64
		database.DB.Model(&models.ExamAttempt{}).Where("exam_id = ? AND status = ?", e.ID, "submitted").Count(&submissionCount)
		if submissionCount == 0 {
			database.DB.Model(&models.Submission{}).Where("exam_id = ?", e.ID).Distinct("user_id").Count(&submissionCount)
		}

		var studentCount int64
		database.DB.Model(&models.ExamAttempt{}).Where("exam_id = ?", e.ID).Distinct("user_id").Count(&studentCount)
		if studentCount == 0 {
			database.DB.Model(&models.Submission{}).Where("exam_id = ?", e.ID).Distinct("user_id").Count(&studentCount)
		}

		result[i] = ExamWithMeta{
			Exam:            e,
			ProblemCount:    problemCount,
			ClassCount:      len(e.ExamClasses),
			Status:          computeExamStatus(e, now),
			SubmissionCount: submissionCount,
			StudentCount:    studentCount,
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
		"title":              req.Title,
		"description":        req.Description,
		"shuffle_questions":  req.ShuffleQuestions,
		"show_results_after": req.ShowResultsAfter,
		"is_practice":        req.IsPractice,
	}
	if req.IsDraft != nil {
		updates["is_draft"] = *req.IsDraft
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

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var problemIDs []uint
		if err := tx.Model(&models.Problem{}).Where("exam_id = ?", exam.ID).Pluck("id", &problemIDs).Error; err != nil {
			return err
		}

		if len(problemIDs) > 0 {
			if err := tx.Where("submission_id IN (?)",
				tx.Model(&models.Submission{}).Select("id").Where("exam_id = ?", exam.ID),
			).Delete(&models.TestResult{}).Error; err != nil {
				return err
			}
			if err := tx.Where("problem_id IN ?", problemIDs).Delete(&models.TestCase{}).Error; err != nil {
				return err
			}
		}

		if err := tx.Where("exam_id = ?", exam.ID).Delete(&models.Submission{}).Error; err != nil {
			return err
		}
		if err := tx.Where("exam_id = ?", exam.ID).Delete(&models.ExamAttempt{}).Error; err != nil {
			return err
		}
		if err := tx.Where("exam_id = ?", exam.ID).Delete(&models.Problem{}).Error; err != nil {
			return err
		}
		if err := tx.Where("exam_id = ?", exam.ID).Delete(&models.ExamClass{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&exam).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete exam: " + err.Error()})
		return
	}

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

func GetExamResults(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var submissions []models.Submission
	database.DB.Where("exam_id = ?", exam.ID).
		Preload("User").
		Preload("Problem").
		Order("submitted_at desc").
		Find(&submissions)

	type StudentResult struct {
		UserID      uint                `json:"user_id"`
		Name        string              `json:"name"`
		Email       string              `json:"email"`
		Submissions []models.Submission `json:"submissions"`
		TotalScore  float64             `json:"total_score"`
		AvgScore    float64             `json:"avg_score"`
	}

	studentMap := make(map[uint]*StudentResult)
	for _, sub := range submissions {
		sr, exists := studentMap[sub.UserID]
		if !exists {
			sr = &StudentResult{
				UserID: sub.UserID,
				Name:   sub.User.Name,
				Email:  sub.User.Email,
			}
			studentMap[sub.UserID] = sr
		}
		sr.Submissions = append(sr.Submissions, sub)
		sr.TotalScore += sub.Score
	}

	results := make([]StudentResult, 0, len(studentMap))
	for _, sr := range studentMap {
		if len(sr.Submissions) > 0 {
			sr.AvgScore = sr.TotalScore / float64(len(sr.Submissions))
		}
		results = append(results, *sr)
	}

	c.JSON(http.StatusOK, results)
}

// StartAttempt returns an existing in-progress attempt for the user/exam,
// or creates a new one. Idempotent.
func StartAttempt(c *gin.Context) {
	userID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.First(&exam, examID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var attempt models.ExamAttempt
	err := database.DB.Where("user_id = ? AND exam_id = ?", userID, exam.ID).First(&attempt).Error
	if err == gorm.ErrRecordNotFound {
		attempt = models.ExamAttempt{
			UserID: userID,
			ExamID: exam.ID,
			Status: "in_progress",
		}
		if err := database.DB.Create(&attempt).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to start attempt"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load attempt"})
		return
	}

	c.JSON(http.StatusOK, attempt)
}

type submitAnswer struct {
	ProblemID       uint   `json:"problem_id"`
	Type            string `json:"type"`
	Language        string `json:"language"`
	Code            string `json:"code"`
	SelectedOptions string `json:"selected_options"`
	TextAnswer      string `json:"text_answer"`
}

type submitAttemptRequest struct {
	Answers []submitAnswer `json:"answers"`
}

// SubmitAttempt finalises an attempt: creates one Submission per answer
// linked to the attempt, schedules grading, and posts a single notification.
func SubmitAttempt(c *gin.Context) {
	userID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.First(&exam, examID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var req submitAttemptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	var attempt models.ExamAttempt
	err := database.DB.Where("user_id = ? AND exam_id = ?", userID, exam.ID).First(&attempt).Error
	if err == gorm.ErrRecordNotFound {
		attempt = models.ExamAttempt{UserID: userID, ExamID: exam.ID, Status: "in_progress"}
		if err := database.DB.Create(&attempt).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create attempt"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load attempt"})
		return
	}

	if attempt.Status == "submitted" {
		c.JSON(http.StatusConflict, gin.H{"error": "attempt already submitted"})
		return
	}

	createdIDs := make([]uint, 0, len(req.Answers))
	for _, a := range req.Answers {
		submissionType := a.Type
		if submissionType == "" {
			var p models.Problem
			if err := database.DB.First(&p, a.ProblemID).Error; err == nil {
				submissionType = p.Type
			}
			if submissionType == "" {
				submissionType = "coding"
			}
		}
		selected := a.SelectedOptions
		if selected == "" {
			selected = "null"
		}

		sub := models.Submission{
			UserID:          userID,
			ProblemID:       a.ProblemID,
			ExamID:          exam.ID,
			ExamAttemptID:   &attempt.ID,
			Type:            submissionType,
			Language:        a.Language,
			Code:            a.Code,
			SelectedOptions: selected,
			TextAnswer:      a.TextAnswer,
			Status:          "pending",
		}
		if err := database.DB.Create(&sub).Error; err != nil {
			continue
		}
		createdIDs = append(createdIDs, sub.ID)

		switch submissionType {
		case "mcq":
			go judge0.GradeMCQ(sub.ID)
		case "written":
			go judge0.GradeWritten(sub.ID)
		default:
			go judge0.Grade(sub.ID)
		}
	}

	now := time.Now()
	database.DB.Model(&attempt).Updates(map[string]any{
		"status":       "submitted",
		"submitted_at": now,
	})

	notification.Create(userID, "submission",
		"Exam Submitted",
		fmt.Sprintf("Your submission for \"%s\" has been received and is being graded.", exam.Title),
		"/dashboard/results",
	)

	c.JSON(http.StatusCreated, gin.H{
		"attempt_id":     attempt.ID,
		"submission_ids": createdIDs,
	})
}

// GetMyAttempts returns all exam attempts for the current user, with
// their associated submissions preloaded. Used by student results and
// dashboard pages to render one row per attempt.
func GetMyAttempts(c *gin.Context) {
	userID := c.GetUint("user_id")

	var attempts []models.ExamAttempt
	database.DB.Where("user_id = ?", userID).
		Preload("Exam").
		Preload("Submissions").
		Preload("Submissions.Problem").
		Order("started_at desc").
		Find(&attempts)

	c.JSON(http.StatusOK, attempts)
}

func computeExamStatus(e models.Exam, now time.Time) string {
	if e.StartTime == nil {
		return "draft"
	}
	if e.EndTime != nil && now.After(*e.EndTime) {
		return "completed"
	}
	if now.Before(*e.StartTime) {
		return "upcoming"
	}
	return "active"
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
