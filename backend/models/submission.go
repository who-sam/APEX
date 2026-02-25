package models

import "time"

type Submission struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	UserID          uint      `gorm:"not null;index" json:"user_id"`
	User            User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ProblemID       uint      `gorm:"not null;index" json:"problem_id"`
	Problem         Problem   `gorm:"foreignKey:ProblemID" json:"problem,omitempty"`
	ExamID          uint      `gorm:"not null;index" json:"exam_id"`
	Language        string    `gorm:"size:20;not null" json:"language"`
	Code            string    `gorm:"type:text;not null" json:"code"`
	Status          string    `gorm:"size:30;not null;default:pending" json:"status"`
	PassedCount     int       `gorm:"not null;default:0" json:"passed_count"`
	TotalCount      int       `gorm:"not null;default:0" json:"total_count"`
	Score           float64   `gorm:"not null;default:0" json:"score"`
	ExecutionTimeMs int       `gorm:"default:0" json:"execution_time_ms"`
	MemoryKb        int       `gorm:"default:0" json:"memory_kb"`
	SubmittedAt     time.Time `gorm:"autoCreateTime" json:"submitted_at"`

	TestResults []TestResult `gorm:"foreignKey:SubmissionID" json:"test_results,omitempty"`
}
