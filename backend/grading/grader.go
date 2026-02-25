package grading

import (
	"bytes"
	"codejudge-backend/database"
	"codejudge-backend/models"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

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
