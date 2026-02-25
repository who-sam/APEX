package models

type TestResult struct {
	ID              uint   `gorm:"primaryKey" json:"id"`
	SubmissionID    uint   `gorm:"not null;index" json:"submission_id"`
	TestCaseID      uint   `gorm:"not null;index" json:"test_case_id"`
	Passed          bool   `gorm:"not null;default:false" json:"passed"`
	ActualOutput    string `gorm:"type:text" json:"actual_output"`
	ExecutionTimeMs int    `gorm:"default:0" json:"execution_time_ms"`
	MemoryKb        int    `gorm:"default:0" json:"memory_kb"`
	Status          string `gorm:"size:30" json:"status"`
}
