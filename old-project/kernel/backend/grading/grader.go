package grading

import (
	"encoding/json"
	"fmt"
	"kernel-backend/database"
	"kernel-backend/models"
	"strconv"
	"strings"
)

func Grade(submissionID uint) {
	var sub models.Submission
	if err := database.DB.First(&sub, submissionID).Error; err != nil {
		return
	}
	database.DB.Model(&sub).Update("status", "running")

	var testCases []models.TestCase
	database.DB.Where("problem_id = ?", sub.ProblemID).Order("order_index ASC").Find(&testCases)

	if len(testCases) == 0 {
		database.DB.Model(&sub).Updates(map[string]any{
			"score":  100,
			"status": "accepted",
		})
		createNotification(sub.UserID, "result", "Submission Graded",
			"Your submission has been graded: 100%",
			fmt.Sprintf("/submissions/%d", sub.ID))
		return
	}

	passed := 0
	total := len(testCases)
	var maxTime int
	var maxMem int

	for _, tc := range testCases {
		cr := RunCode(sub.Code, sub.Language, tc.Input)
		actual := strings.TrimSpace(cr.Stdout)
		expected := strings.TrimSpace(tc.ExpectedOutput)
		ok := actual == expected && cr.StatusID == 3
		if ok {
			passed++
		}

		status := "wrong_answer"
		switch cr.StatusID {
		case 3:
			if ok {
				status = "accepted"
			}
		case 5:
			status = "time_limit_exceeded"
		case 6:
			status = "compilation_error"
		case 11:
			status = "runtime_error"
		}

		execTime := 0
		if cr.Time != "" {
			if f, err := strconv.ParseFloat(cr.Time, 64); err == nil {
				execTime = int(f * 1000)
			}
		}
		memKb := 0
		if cr.Memory != "" {
			if f, err := strconv.ParseFloat(cr.Memory, 64); err == nil {
				memKb = int(f)
			}
		}
		if execTime > maxTime {
			maxTime = execTime
		}
		if memKb > maxMem {
			maxMem = memKb
		}

		database.DB.Create(&models.TestResult{
			SubmissionID:    sub.ID,
			TestCaseID:      tc.ID,
			Passed:          ok,
			ActualOutput:    actual,
			ExecutionTimeMs: execTime,
			MemoryKb:        memKb,
			Status:          status,
		})
	}

	score := float64(passed) / float64(total) * 100
	finalStatus := "wrong_answer"
	if passed == total {
		finalStatus = "accepted"
	}

	database.DB.Model(&sub).Updates(map[string]any{
		"passed_count":      passed,
		"total_count":       total,
		"score":             score,
		"status":            finalStatus,
		"execution_time_ms": maxTime,
		"memory_kb":         maxMem,
	})

	createNotification(sub.UserID, "result", "Submission Graded",
		fmt.Sprintf("Your submission scored %.0f%% (%d/%d test cases passed)", score, passed, total),
		fmt.Sprintf("/submissions/%d", sub.ID))
}

func GradeMCQ(submissionID uint) {
	var sub models.Submission
	if err := database.DB.First(&sub, submissionID).Error; err != nil {
		return
	}

	var problem models.Problem
	if err := database.DB.First(&problem, sub.ProblemID).Error; err != nil {
		return
	}

	var correctIDs []string
	json.Unmarshal([]byte(problem.CorrectOptionIDs), &correctIDs)

	var selectedIDs []string
	json.Unmarshal([]byte(sub.SelectedOptions), &selectedIDs)

	score := 0.0
	status := "wrong_answer"
	if setsEqual(correctIDs, selectedIDs) {
		score = 100
		status = "accepted"
	}

	database.DB.Model(&sub).Updates(map[string]any{
		"score":        score,
		"status":       status,
		"passed_count": boolToInt(score == 100),
		"total_count":  1,
	})

	createNotification(sub.UserID, "result", "MCQ Graded",
		fmt.Sprintf("Your answer was %s", status),
		fmt.Sprintf("/submissions/%d", sub.ID))
}

func GradeWritten(submissionID uint) {
	var sub models.Submission
	if err := database.DB.First(&sub, submissionID).Error; err != nil {
		return
	}

	database.DB.Model(&sub).Update("status", "pending_review")
	createNotification(sub.UserID, "submission", "Written Answer Submitted",
		"Your written answer is pending review",
		fmt.Sprintf("/submissions/%d", sub.ID))
}

func createNotification(userID uint, ntype, title, description, linkTo string) {
	database.DB.Create(&models.Notification{
		UserID:      userID,
		Type:        ntype,
		Title:       title,
		Description: description,
		LinkTo:      linkTo,
	})
}

func setsEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	set := make(map[string]bool, len(a))
	for _, v := range a {
		set[v] = true
	}
	for _, v := range b {
		if !set[v] {
			return false
		}
	}
	return true
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
