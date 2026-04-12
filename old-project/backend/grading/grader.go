package grading

import (
	"bytes"
	"codejudge-backend/database"
	"codejudge-backend/models"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// CreateNotification is a helper to create notifications from grading routines.
func CreateNotification(userID uint, notifType, title, description, linkTo string) {
	notif := models.Notification{
		UserID:      userID,
		Type:        notifType,
		Title:       title,
		Description: description,
		LinkTo:      linkTo,
	}
	database.DB.Create(&notif)
}

const judge0URL = "https://ce.judge0.com/submissions?wait=true&base64_encoded=false&fields=stdout,stderr,compile_output,status,time,memory"

var languageMap = map[string]int{
	"python3":    100,
	"javascript": 102,
	"c":          103,
	"cpp":        105,
}

type judge0Request struct {
	LanguageID int    `json:"language_id"`
	SourceCode string `json:"source_code"`
	Stdin      string `json:"stdin"`
}

type judge0Response struct {
	Stdout        *string      `json:"stdout"`
	Stderr        *string      `json:"stderr"`
	CompileOutput *string      `json:"compile_output"`
	Status        judge0Status `json:"status"`
	Time          *string      `json:"time"`
	Memory        *json.Number `json:"memory"`
}

type judge0Status struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

type TestCaseResult struct {
	TestCaseID     uint   `json:"test_case_id"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	ActualOutput   string `json:"actual_output"`
	Passed         bool   `json:"passed"`
	Status         string `json:"status"`
}

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

	for _, tc := range testCases {
		result := runCode(submission.Code, submission.Language, tc.Input)

		actualOutput := strings.TrimSpace(result.stdout)
		expectedOutput := strings.TrimSpace(tc.ExpectedOutput)
		isPassed := actualOutput == expectedOutput && result.statusID == 3

		if isPassed {
			passed++
		}

		status := "accepted"
		if !isPassed {
			if result.statusID == 6 {
				status = "compilation_error"
			} else if result.statusID == 5 {
				status = "time_limit_exceeded"
			} else if result.statusID == 11 {
				status = "runtime_error"
			} else {
				status = "wrong_answer"
			}
		}

		tr := models.TestResult{
			SubmissionID: submission.ID,
			TestCaseID:   tc.ID,
			Passed:       isPassed,
			ActualOutput: actualOutput,
			Status:       status,
		}
		database.DB.Create(&tr)
	}

	score := float64(passed) / float64(total) * 100.0
	finalStatus := "wrong_answer"
	if passed == total {
		finalStatus = "accepted"
	}

	database.DB.Model(&submission).Updates(map[string]any{
		"status":       finalStatus,
		"passed_count": passed,
		"total_count":  total,
		"score":        score,
	})

	CreateNotification(submission.UserID, "result",
		"Submission Graded",
		fmt.Sprintf("Your coding submission scored %.0f%% (%d/%d test cases passed)", score, passed, total),
		"/dashboard/results",
	)
}

type codeResult struct {
	stdout   string
	stderr   string
	statusID int
}

func runCode(code, language, stdin string) codeResult {
	langID, ok := languageMap[language]
	if !ok {
		return codeResult{statusID: -1, stderr: "unsupported language"}
	}

	j0Req := judge0Request{
		LanguageID: langID,
		SourceCode: code,
		Stdin:      stdin,
	}

	body, err := json.Marshal(j0Req)
	if err != nil {
		return codeResult{statusID: -1, stderr: "failed to marshal request"}
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(judge0URL, "application/json", bytes.NewReader(body))
	if err != nil {
		return codeResult{statusID: -1, stderr: "judge0 unreachable"}
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return codeResult{statusID: -1, stderr: "failed to read response"}
	}

	var j0Resp judge0Response
	if err := json.Unmarshal(respBody, &j0Resp); err != nil {
		return codeResult{statusID: -1, stderr: "failed to parse response"}
	}

	return codeResult{
		stdout:   deref(j0Resp.Stdout),
		stderr:   deref(j0Resp.Stderr),
		statusID: j0Resp.Status.ID,
	}
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// GradeMCQ auto-grades an MCQ submission by comparing selected options to correct options.
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

	// Parse correct option IDs from problem
	var correctIDs []string
	if err := json.Unmarshal([]byte(problem.CorrectOptionIDs), &correctIDs); err != nil {
		log.Printf("grading mcq: failed to parse correct_option_ids: %v", err)
		database.DB.Model(&submission).Update("status", "error")
		return
	}

	// Parse selected options from submission
	var selectedIDs []string
	if submission.SelectedOptions != "" {
		if err := json.Unmarshal([]byte(submission.SelectedOptions), &selectedIDs); err != nil {
			log.Printf("grading mcq: failed to parse selected_options: %v", err)
			database.DB.Model(&submission).Update("status", "error")
			return
		}
	}

	// Compare sets
	correctSet := make(map[string]bool)
	for _, id := range correctIDs {
		correctSet[id] = true
	}
	selectedSet := make(map[string]bool)
	for _, id := range selectedIDs {
		selectedSet[id] = true
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

	database.DB.Model(&submission).Updates(map[string]any{
		"status":       status,
		"score":        score,
		"passed_count": boolToInt(isCorrect),
		"total_count":  1,
	})

	resultText := "incorrect"
	if isCorrect {
		resultText = "correct"
	}
	CreateNotification(submission.UserID, "result",
		"MCQ Graded",
		fmt.Sprintf("Your MCQ answer was %s", resultText),
		"/dashboard/results",
	)
}

// GradeWritten marks a written submission as pending_review for manual grading.
func GradeWritten(submissionID uint) {
	var submission models.Submission
	if err := database.DB.First(&submission, submissionID).Error; err != nil {
		log.Printf("grading written: submission %d not found: %v", submissionID, err)
		return
	}

	database.DB.Model(&submission).Updates(map[string]any{
		"status": "pending_review",
	})

	CreateNotification(submission.UserID, "submission",
		"Written Answer Received",
		"Your written answer has been submitted and is pending review.",
		"/dashboard/results",
	)
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}

func RunAgainstTestCases(code, language string, testCases []models.TestCase) []TestCaseResult {
	results := make([]TestCaseResult, len(testCases))
	for i, tc := range testCases {
		result := runCode(code, language, tc.Input)
		actualOutput := strings.TrimSpace(result.stdout)
		expectedOutput := strings.TrimSpace(tc.ExpectedOutput)

		results[i] = TestCaseResult{
			TestCaseID:     tc.ID,
			Input:          tc.Input,
			ExpectedOutput: tc.ExpectedOutput,
			ActualOutput:   actualOutput,
			Passed:         actualOutput == expectedOutput && result.statusID == 3,
			Status:         "completed",
		}
	}
	return results
}
