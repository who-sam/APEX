package models

import "time"

type Problem struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	ExamID        uint      `gorm:"not null;index" json:"exam_id"`
	IsBank        bool      `gorm:"not null;default:false;index" json:"is_bank"`
	TeacherID     uint      `gorm:"index" json:"teacher_id"`
	Title         string    `gorm:"size:255;not null" json:"title"`
	Description   string    `gorm:"type:text;not null" json:"description"`
	Type          string    `gorm:"size:20;not null;default:coding" json:"type"`
	Points        int       `gorm:"not null;default:10" json:"points"`
	Difficulty    string    `gorm:"size:20;not null;default:medium" json:"difficulty"`
	StarterCode   string    `gorm:"type:text" json:"starter_code"`
	Hints         string    `gorm:"type:text" json:"hints"`
	TimeLimitMs   int       `gorm:"not null;default:2000" json:"time_limit_ms"`
	MemoryLimitKb int       `gorm:"not null;default:262144" json:"memory_limit_kb"`
	OrderIndex    int       `gorm:"not null;default:0" json:"order_index"`
	CreatedAt     time.Time `json:"created_at"`

	// MCQ fields
	Options          string `gorm:"type:jsonb" json:"options,omitempty"`
	CorrectOptionIDs string `gorm:"type:jsonb" json:"correct_option_ids,omitempty"`
	MultipleCorrect  bool   `gorm:"default:false" json:"multiple_correct"`
	Explanation      string `gorm:"type:text" json:"explanation,omitempty"`

	// Written fields
	MaxWordCount         int    `gorm:"default:500" json:"max_word_count,omitempty"`
	Rubric               string `gorm:"type:text" json:"rubric,omitempty"`
	RequireManualGrading bool   `gorm:"default:false" json:"require_manual_grading"`

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
