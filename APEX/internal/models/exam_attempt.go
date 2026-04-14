package models

import "time"

type ExamAttempt struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	UserID      uint       `gorm:"not null;index;uniqueIndex:idx_user_exam_attempt" json:"user_id"`
	User        User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ExamID      uint       `gorm:"not null;index;uniqueIndex:idx_user_exam_attempt" json:"exam_id"`
	Exam        Exam       `gorm:"foreignKey:ExamID" json:"exam,omitempty"`
	StartedAt   time.Time  `gorm:"autoCreateTime" json:"started_at"`
	SubmittedAt *time.Time `json:"submitted_at,omitempty"`
	Score       float64    `gorm:"not null;default:0" json:"score"`
	Status      string     `gorm:"size:30;not null;default:in_progress" json:"status"`

	Submissions []Submission `gorm:"foreignKey:ExamAttemptID" json:"submissions,omitempty"`
}
