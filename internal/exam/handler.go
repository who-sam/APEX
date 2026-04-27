package exam

import (
	"apex/internal/database"
	"apex/internal/judge0"
	"apex/internal/models"
	"apex/internal/notification"
	"encoding/json"
	"fmt"
	"io"
	"math"
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
	// Note: start_time is intentionally left nil when the teacher hasn't
	// set one. Drafts can stay schedule-less; publishing without a
	// schedule is rejected by UpdateExam below.
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
		ClassID         *uint  `json:"class_id"`
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

		var classID *uint
		if len(e.ExamClasses) > 0 {
			classID = &e.ExamClasses[0].ClassID
		}
		result[i] = ExamWithMeta{
			Exam:            e,
			ProblemCount:    problemCount,
			ClassCount:      len(e.ExamClasses),
			ClassID:         classID,
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

	var attemptCount int64
	database.DB.Model(&models.ExamAttempt{}).Where("exam_id = ?", exam.ID).Count(&attemptCount)

	c.JSON(http.StatusOK, gin.H{
		"id":                 exam.ID,
		"teacher_id":         exam.TeacherID,
		"title":              exam.Title,
		"description":        exam.Description,
		"duration_minutes":   exam.DurationMinutes,
		"start_time":         exam.StartTime,
		"end_time":           exam.EndTime,
		"reset_at":           exam.ResetAt,
		"created_at":         exam.CreatedAt,
		"shuffle_questions":  exam.ShuffleQuestions,
		"show_results_after": exam.ShowResultsAfter,
		"passing_score":      exam.PassingScore,
		"is_practice":        exam.IsPractice,
		"is_draft":           exam.IsDraft,
		"problems":           exam.Problems,
		"exam_classes":       exam.ExamClasses,
		"attempt_count":      attemptCount,
	})
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

	// Refuse to publish (is_draft -> false) without a start_time set.
	// This used to silently set start_time = now, which surprised
	// teachers by opening the exam the moment they hit Publish.
	publishing := req.IsDraft != nil && !*req.IsDraft
	willHaveStart := exam.StartTime != nil
	if t, ok := updates["start_time"].(time.Time); ok {
		willHaveStart = !t.IsZero()
	}
	if publishing && !willHaveStart {
		c.JSON(http.StatusBadRequest, gin.H{"error": "set a start time before publishing"})
		return
	}

	database.DB.Model(&exam).Updates(updates)
	c.JSON(http.StatusOK, exam)
}

func CloseExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	now := time.Now()
	if err := database.DB.Model(&exam).Update("end_time", now).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to close exam"})
		return
	}
	exam.EndTime = &now
	c.JSON(http.StatusOK, exam)
}

type reopenRequest struct {
	Minutes int `json:"minutes" binding:"required"`
}

func ReopenExam(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	var req reopenRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Minutes <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "minutes must be > 0"})
		return
	}

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	now := time.Now()
	end := now.Add(time.Duration(req.Minutes) * time.Minute)
	updates := map[string]any{"end_time": end}
	if exam.StartTime == nil || exam.StartTime.After(now) {
		updates["start_time"] = now
	}
	if err := database.DB.Model(&exam).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reopen exam"})
		return
	}
	exam.EndTime = &end
	if st, ok := updates["start_time"].(time.Time); ok {
		exam.StartTime = &st
	}
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

	// Verify every class_id is owned by the calling teacher.
	if len(req.ClassIDs) > 0 {
		var ownedCount int64
		database.DB.Model(&models.Class{}).
			Where("id IN ? AND teacher_id = ?", req.ClassIDs, teacherID).
			Count(&ownedCount)
		if int(ownedCount) != len(req.ClassIDs) {
			c.JSON(http.StatusForbidden, gin.H{"error": "one or more classes do not belong to you"})
			return
		}
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
		Preload("TestResults", func(db *gorm.DB) *gorm.DB {
			return db.Order("id asc")
		}).
		Preload("TestResults.TestCase").
		Order("submitted_at desc").
		Find(&submissions)

	type StudentResult struct {
		UserID         uint                `json:"user_id"`
		Name           string              `json:"name"`
		Email          string              `json:"email"`
		Submissions    []models.Submission `json:"submissions"`
		TotalScore     float64             `json:"total_score"`
		AvgScore       float64             `json:"avg_score"`
		DurationSecs   int                 `json:"duration_seconds"`
	}

	// Load attempts for timing
	var attempts []models.ExamAttempt
	database.DB.Where("exam_id = ?", exam.ID).Find(&attempts)
	attemptByUser := map[uint]models.ExamAttempt{}
	for _, a := range attempts {
		attemptByUser[a.UserID] = a
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
	}

	results := make([]StudentResult, 0, len(studentMap))
	for _, sr := range studentMap {
		// Compute weighted score: earned points / total points * 100
		var earnedPoints, totalPoints float64
		for _, sub := range sr.Submissions {
			pts := float64(sub.Problem.Points)
			if pts <= 0 {
				pts = 10
			}
			totalPoints += pts
			earnedPoints += sub.Score / 100.0 * pts
		}
		sr.TotalScore = math.Round(earnedPoints*10) / 10
		if totalPoints > 0 {
			sr.AvgScore = math.Round(earnedPoints/totalPoints*10000) / 100
		}
		if a, ok := attemptByUser[sr.UserID]; ok && a.SubmittedAt != nil {
			sr.DurationSecs = int(a.SubmittedAt.Sub(a.StartedAt).Seconds())
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

	var classIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("user_id = ?", userID).Pluck("class_id", &classIDs)
	if len(classIDs) == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "not enrolled in any class"})
		return
	}
	var assignedCount int64
	database.DB.Model(&models.ExamClass{}).Where("exam_id = ? AND class_id IN ?", exam.ID, classIDs).Count(&assignedCount)
	if assignedCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "exam not assigned to your class"})
		return
	}

	if exam.IsDraft {
		c.JSON(http.StatusForbidden, gin.H{"error": "exam is not published"})
		return
	}

	now := time.Now()
	if exam.StartTime == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "exam has no scheduled start time"})
		return
	}
	if now.Before(*exam.StartTime) {
		c.JSON(http.StatusForbidden, gin.H{"error": "exam has not started yet", "start_time": exam.StartTime})
		return
	}
	if exam.EndTime != nil && now.After(*exam.EndTime) {
		c.JSON(http.StatusForbidden, gin.H{"error": "exam window closed", "end_time": exam.EndTime})
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
		"status":         "submitted",
		"submitted_at":   now,
		"draft_answers":  gorm.Expr("NULL"),
		"draft_saved_at": gorm.Expr("NULL"),
	})

	notification.Create(userID, "submission",
		"Exam Submitted",
		fmt.Sprintf("Your submission for \"%s\" has been received and is being graded.", exam.Title),
		fmt.Sprintf("/dashboard/exam/%d/review", exam.ID),
	)

	c.JSON(http.StatusCreated, gin.H{
		"attempt_id":     attempt.ID,
		"submission_ids": createdIDs,
	})
}

// AutosaveAttempt persists in-progress answers as a JSON blob on the
// student's active ExamAttempt so they can resume on a different device
// or after a browser crash. The payload is opaque to the server — the
// client serialises whatever shape its UI needs and re-hydrates it on
// next start. Rejected once the attempt has been submitted.
func AutosaveAttempt(c *gin.Context) {
	userID := c.GetUint("user_id")
	examID := c.Param("id")

	var attempt models.ExamAttempt
	if err := database.DB.Where("user_id = ? AND exam_id = ?", userID, examID).First(&attempt).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no active attempt for this exam"})
		return
	}
	if attempt.Status == "submitted" {
		c.JSON(http.StatusConflict, gin.H{"error": "attempt already submitted"})
		return
	}

	// Read raw body so any client-shape JSON round-trips unchanged.
	body, err := io.ReadAll(c.Request.Body)
	if err != nil || len(body) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if !json.Valid(body) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "body must be valid JSON"})
		return
	}

	now := time.Now()
	if err := database.DB.Model(&attempt).Updates(map[string]any{
		"draft_answers":  string(body),
		"draft_saved_at": now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to autosave"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"saved_at": now})
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

	// Build response with grades_announced flag per attempt
	type attemptWithGrades struct {
		models.ExamAttempt
		GradesAnnounced bool `json:"grades_announced"`
	}

	result := make([]attemptWithGrades, len(attempts))
	for i, a := range attempts {
		result[i].ExamAttempt = a
		var count int64
		database.DB.Model(&models.Class{}).
			Joins("JOIN exam_classes ON exam_classes.class_id = classes.id").
			Where("exam_classes.exam_id = ? AND classes.grades_announced = ?", a.ExamID, true).
			Count(&count)
		result[i].GradesAnnounced = count > 0
	}

	c.JSON(http.StatusOK, result)
}

func computeExamStatus(e models.Exam, now time.Time) string {
	if e.IsDraft {
		return "draft"
	}
	if e.StartTime == nil {
		return "upcoming"
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
