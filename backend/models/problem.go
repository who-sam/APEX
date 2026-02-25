package models

import "time"

type Problem struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	ExamID        uint      `gorm:"not null;index" json:"exam_id"`
	Title         string    `gorm:"size:255;not null" json:"title"`
	Description   string    `gorm:"type:text;not null" json:"description"`
	Difficulty    string    `gorm:"size:20;not null;default:medium" json:"difficulty"`
	StarterCode   string    `gorm:"type:text" json:"starter_code"`
	Hints         string    `gorm:"type:text" json:"hints"`
	TimeLimitMs   int       `gorm:"not null;default:2000" json:"time_limit_ms"`
	MemoryLimitKb int       `gorm:"not null;default:262144" json:"memory_limit_kb"`
	OrderIndex    int       `gorm:"not null;default:0" json:"order_index"`
	CreatedAt     time.Time `json:"created_at"`

	TestCases []TestCase `gorm:"foreignKey:ProblemID" json:"test_cases,omitempty"`
}

type TestCase struct {
	ID             uint   `gorm:"primaryKey" json:"id"`
	ProblemID      uint   `gorm:"not null;index" json:"problem_id"`
	Input          string `gorm:"type:text;not null" json:"input"`
	ExpectedOutput string `gorm:"type:text;not null" json:"expected_output"`
	IsSample       bool   `gorm:"not null;default:false" json:"is_sample"`
	OrderIndex     int    `gorm:"not null;default:0" json:"order_index"`
}
