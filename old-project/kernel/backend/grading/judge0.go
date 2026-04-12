package grading

import (
	"bytes"
	"encoding/json"
	"kernel-backend/models"
	"net/http"
	"strings"
	"time"
)

var judge0URL = "https://ce.judge0.com"

func SetJudge0URL(url string) {
	judge0URL = strings.TrimRight(url, "/")
}

var languageMap = map[string]int{
	"python":     100,
	"python3":    100,
	"javascript": 102,
	"c":          103,
	"cpp":        105,
	"c++":        105,
	"java":       91,
	"go":         95,
}

type judge0Request struct {
	LanguageID int    `json:"language_id"`
	SourceCode string `json:"source_code"`
	Stdin      string `json:"stdin"`
}

type judge0Status struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

type judge0Response struct {
	Stdout        *string       `json:"stdout"`
	Stderr        *string       `json:"stderr"`
	CompileOutput *string       `json:"compile_output"`
	Status        judge0Status  `json:"status"`
	Time          *string       `json:"time"`
	Memory        *json.Number  `json:"memory"`
}

type CodeResult struct {
	Stdout        string `json:"stdout"`
	Stderr        string `json:"stderr"`
	CompileOutput string `json:"compile_output"`
	StatusID      int    `json:"status_id"`
	StatusDesc    string `json:"status_description"`
	Time          string `json:"time"`
	Memory        string `json:"memory"`
}

func GetLanguageID(lang string) (int, bool) {
	id, ok := languageMap[strings.ToLower(lang)]
	return id, ok
}

func RunCode(code, language, stdin string) CodeResult {
	langID, ok := GetLanguageID(language)
	if !ok {
		return CodeResult{Stderr: "unsupported language: " + language, StatusID: 0}
	}

	body, _ := json.Marshal(judge0Request{
		LanguageID: langID,
		SourceCode: code,
		Stdin:      stdin,
	})

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(
		judge0URL+"/submissions?wait=true&base64_encoded=false&fields=stdout,stderr,compile_output,status,time,memory",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return CodeResult{Stderr: "judge0 request failed: " + err.Error(), StatusID: 0}
	}
	defer resp.Body.Close()

	var j0 judge0Response
	if err := json.NewDecoder(resp.Body).Decode(&j0); err != nil {
		return CodeResult{Stderr: "judge0 response parse failed", StatusID: 0}
	}

	result := CodeResult{
		StatusID:   j0.Status.ID,
		StatusDesc: j0.Status.Description,
	}
	if j0.Stdout != nil {
		result.Stdout = *j0.Stdout
	}
	if j0.Stderr != nil {
		result.Stderr = *j0.Stderr
	}
	if j0.CompileOutput != nil {
		result.CompileOutput = *j0.CompileOutput
	}
	if j0.Time != nil {
		result.Time = *j0.Time
	}
	if j0.Memory != nil {
		result.Memory = j0.Memory.String()
	}
	return result
}

type TestCaseResult struct {
	TestCaseID     uint   `json:"test_case_id"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	ActualOutput   string `json:"actual_output"`
	Passed         bool   `json:"passed"`
	Status         string `json:"status"`
	StatusID       int    `json:"status_id"`
}

func RunAgainstTestCases(code, language string, testCases []models.TestCase) []TestCaseResult {
	results := make([]TestCaseResult, 0, len(testCases))
	for _, tc := range testCases {
		cr := RunCode(code, language, tc.Input)
		actual := strings.TrimSpace(cr.Stdout)
		expected := strings.TrimSpace(tc.ExpectedOutput)
		passed := actual == expected && cr.StatusID == 3

		status := "wrong_answer"
		switch cr.StatusID {
		case 3:
			if passed {
				status = "accepted"
			}
		case 5:
			status = "time_limit_exceeded"
		case 6:
			status = "compilation_error"
		case 11:
			status = "runtime_error"
		}

		results = append(results, TestCaseResult{
			TestCaseID:     tc.ID,
			Input:          tc.Input,
			ExpectedOutput: tc.ExpectedOutput,
			ActualOutput:   actual,
			Passed:         passed,
			Status:         status,
			StatusID:       cr.StatusID,
		})
	}
	return results
}
