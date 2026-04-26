package judge0

import (
	"apex/internal/database"
	"apex/internal/models"
	"apex/internal/notification"
	"encoding/json"
	"fmt"
	"log"
	"strings"
)

func Grade(submissionID uint) {
	var submission models.Submission
	if err := database.DB.First(&submission, submissionID).Error; err != nil {
		log.Printf("grading: submission %d not found: %v", submissionID, err)
		return
	}

	database.DB.Model(&submission).Update("status", "running")

	var testCases []models.TestCase
	database.DB.Where("problem_id = ?", submission.ProblemID).Order("order_index asc").Find(&testCases)

	if len(testCases) == 0 {
		database.DB.Model(&submission).Updates(map[string]any{
			"status": "accepted",
			"score":  100.0,
		})
		return
	}

	passed := 0
	total := len(testCases)
	var maxTimeMs int
	var maxMemoryKb int

	for _, tc := range testCases {
		result := RunCode(submission.Code, submission.Language, tc.Input)

		actualOutput := normalizeOutput(result.Stdout)
		expectedOutput := normalizeOutput(tc.ExpectedOutput)
		// StatusID 3 = Accepted; treat StatusID 4 (Wrong Answer) as valid-run-but-compare.
		ran := result.StatusID == 3 || result.StatusID == 4
		isPassed := ran && actualOutput == expectedOutput

		if isPassed {
			passed++
		}

		status := "accepted"
		if !isPassed {
			switch result.StatusID {
			case 6:
				status = "compilation_error"
			case 5:
				status = "time_limit_exceeded"
			case 11:
				status = "runtime_error"
			default:
				status = "wrong_answer"
			}
		}

		// FIX: populate execution_time_ms and memory_kb on TestResult
		tr := models.TestResult{
			SubmissionID:    submission.ID,
			TestCaseID:      tc.ID,
			Passed:          isPassed,
			ActualOutput:    actualOutput,
			ExecutionTimeMs: result.TimeMs,
			MemoryKb:        result.MemoryKb,
			Status:          status,
		}
		database.DB.Create(&tr)

		if result.TimeMs > maxTimeMs {
			maxTimeMs = result.TimeMs
		}
		if result.MemoryKb > maxMemoryKb {
			maxMemoryKb = result.MemoryKb
		}
	}

	score := float64(passed) / float64(total) * 100.0
	finalStatus := "wrong_answer"
	if passed == total {
		finalStatus = "accepted"
	}

	// FIX: set max time/memory on Submission record
	database.DB.Model(&submission).Updates(map[string]any{
		"status":            finalStatus,
		"passed_count":      passed,
		"total_count":       total,
		"score":             score,
		"execution_time_ms": maxTimeMs,
		"memory_kb":         maxMemoryKb,
	})

	if submission.ExamAttemptID == nil {
		notification.Create(submission.UserID, "result",
			"Submission Graded",
			fmt.Sprintf("Your coding submission scored %.0f%% (%d/%d test cases passed)", score, passed, total),
			"/dashboard/results",
		)
	}
	maybeFinalizeAttempt(submission.ExamAttemptID)
}

func GradeMCQ(submissionID uint) {
	var submission models.Submission
	if err := database.DB.First(&submission, submissionID).Error; err != nil {
		log.Printf("grading mcq: submission %d not found: %v", submissionID, err)
		return
	}

	database.DB.Model(&submission).Update("status", "running")

	var problem models.Problem
	if err := database.DB.First(&problem, submission.ProblemID).Error; err != nil {
		log.Printf("grading mcq: problem %d not found: %v", submission.ProblemID, err)
		database.DB.Model(&submission).Update("status", "error")
		return
	}

	var correctIDs []string
	if err := json.Unmarshal([]byte(problem.CorrectOptionIDs), &correctIDs); err != nil {
		log.Printf("grading mcq: failed to parse correct_option_ids: %v", err)
		database.DB.Model(&submission).Update("status", "error")
		return
	}

	var selectedIDs []string
	if submission.SelectedOptions != "" {
		if err := json.Unmarshal([]byte(submission.SelectedOptions), &selectedIDs); err != nil {
			log.Printf("grading mcq: failed to parse selected_options: %v", err)
			database.DB.Model(&submission).Update("status", "error")
			return
		}
	}

	correctSet := make(map[string]bool)
	for _, id := range correctIDs {
		id = strings.TrimSpace(id)
		if id != "" {
			correctSet[id] = true
		}
	}
	selectedSet := make(map[string]bool)
	for _, id := range selectedIDs {
		id = strings.TrimSpace(id)
		if id != "" {
			selectedSet[id] = true
		}
	}

	// No correct answers configured → cannot fail student; mark pending_review.
	if len(correctSet) == 0 {
		database.DB.Model(&submission).Updates(map[string]any{
			"status":       "pending_review",
			"score":        0.0,
			"passed_count": 0,
			"total_count":  1,
		})
		return
	}

	isCorrect := len(correctSet) == len(selectedSet)
	if isCorrect {
		for id := range correctSet {
			if !selectedSet[id] {
				isCorrect = false
				break
			}
		}
	}

	score := 0.0
	status := "wrong_answer"
	if isCorrect {
		score = 100.0
		status = "accepted"
	}

	passedCount := 0
	if isCorrect {
		passedCount = 1
	}

	database.DB.Model(&submission).Updates(map[string]any{
		"status":       status,
		"score":        score,
		"passed_count": passedCount,
		"total_count":  1,
	})

	resultText := "incorrect"
	if isCorrect {
		resultText = "correct"
	}
	if submission.ExamAttemptID == nil {
		notification.Create(submission.UserID, "result",
			"MCQ Graded",
			fmt.Sprintf("Your MCQ answer was %s", resultText),
			"/dashboard/results",
		)
	}
	maybeFinalizeAttempt(submission.ExamAttemptID)
}

func GradeWritten(submissionID uint) {
	var submission models.Submission
	if err := database.DB.First(&submission, submissionID).Error; err != nil {
		log.Printf("grading written: submission %d not found: %v", submissionID, err)
		return
	}

	database.DB.Model(&submission).Updates(map[string]any{
		"status":       "pending_review",
		"total_count":  1,
		"passed_count": 0,
		"score":        0.0,
	})

	if submission.ExamAttemptID == nil {
		notification.Create(submission.UserID, "submission",
			"Written Answer Received",
			"Your written answer has been submitted and is pending review.",
			"/dashboard/results",
		)
	}
	maybeFinalizeAttempt(submission.ExamAttemptID)
}

// FinalizeAttempt re-aggregates attempt score. Callers outside the
// grader (e.g. manual grading of written answers) should invoke this
// after updating a submission's score.
func FinalizeAttempt(attemptID uint) {
	maybeFinalizeAttempt(&attemptID)
}

// maybeFinalizeAttempt aggregates score across all submissions once none
// remain in pending/running state. Safe to call multiple times.
func maybeFinalizeAttempt(attemptID *uint) {
	if attemptID == nil {
		return
	}
	var pending int64
	database.DB.Model(&models.Submission{}).
		Where("exam_attempt_id = ? AND status IN ?", *attemptID, []string{"pending", "running"}).
		Count(&pending)
	if pending > 0 {
		return
	}

	var subs []models.Submission
	database.DB.Where("exam_attempt_id = ?", *attemptID).Preload("Problem").Find(&subs)
	if len(subs) == 0 {
		return
	}

	// Pending-review submissions (written answers awaiting manual grading)
	// must not pull the aggregate down — they have score=0 as a placeholder.
	// Exclude them from the denominator until a teacher grades them.
	var earnedPoints float64
	var totalPoints float64
	for _, s := range subs {
		if s.Status == "pending_review" {
			continue
		}
		pts := float64(s.Problem.Points)
		if pts <= 0 {
			pts = 10
		}
		totalPoints += pts
		earnedPoints += s.Score / 100.0 * pts
	}
	pct := 0.0
	if totalPoints > 0 {
		pct = earnedPoints / totalPoints * 100.0
	}

	database.DB.Model(&models.ExamAttempt{}).
		Where("id = ?", *attemptID).
		Update("score", pct)

	// Fire a single "Exam Graded" notification once all submissions for the
	// attempt are fully graded (no pending_review remaining). Idempotent via
	// exam_attempts.graded_notified.
	var anyPendingReview int64
	database.DB.Model(&models.Submission{}).
		Where("exam_attempt_id = ? AND status = ?", *attemptID, "pending_review").
		Count(&anyPendingReview)
	if anyPendingReview > 0 {
		return
	}

	var attempt models.ExamAttempt
	if err := database.DB.Preload("Exam").First(&attempt, *attemptID).Error; err != nil {
		return
	}
	if attempt.Status != "submitted" || attempt.GradedNotified {
		return
	}
	database.DB.Model(&attempt).Update("graded_notified", true)
	notification.Create(attempt.UserID, "result",
		"Exam Graded",
		fmt.Sprintf("Your submission for \"%s\" has been graded. Score: %.0f%%", attempt.Exam.Title, pct),
		fmt.Sprintf("/dashboard/exam/%d/review", attempt.ExamID),
	)
}

type TestCaseResult struct {
	TestCaseID     uint   `json:"test_case_id"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	ActualOutput   string `json:"actual_output"`
	Passed         bool   `json:"passed"`
	Status         string `json:"status"`
	TimeMs         int    `json:"time_ms"`
	MemoryKb       int    `json:"memory_kb"`
}

func RunAgainstTestCases(code, language string, testCases []models.TestCase) []TestCaseResult {
	results := make([]TestCaseResult, len(testCases))
	for i, tc := range testCases {
		result := RunCode(code, language, tc.Input)
		actualOutput := normalizeOutput(result.Stdout)
		expectedOutput := normalizeOutput(tc.ExpectedOutput)
		ran := result.StatusID == 3 || result.StatusID == 4

		results[i] = TestCaseResult{
			TestCaseID:     tc.ID,
			Input:          tc.Input,
			ExpectedOutput: tc.ExpectedOutput,
			ActualOutput:   actualOutput,
			Passed:         ran && actualOutput == expectedOutput,
			Status:         "completed",
			TimeMs:         result.TimeMs,
			MemoryKb:       result.MemoryKb,
		}
	}
	return results
}

// normalizeOutput strips CR, trailing whitespace on each line, and trims edges
// so Judge0 output (often \r\n with trailing newline) compares cleanly to
// teacher-entered expected output.
func normalizeOutput(s string) string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.ReplaceAll(s, "\r", "\n")
	lines := strings.Split(s, "\n")
	for i, ln := range lines {
		lines[i] = strings.TrimRight(ln, " \t")
	}
	return strings.TrimSpace(strings.Join(lines, "\n"))
}
