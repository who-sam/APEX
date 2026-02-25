package models

import "time"

type Exam struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	TeacherID       uint       `gorm:"not null;index" json:"teacher_id"`
	Teacher         User       `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	Title           string     `gorm:"size:255;not null" json:"title"`
	Description     string     `gorm:"type:text" json:"description"`
	DurationMinutes int        `gorm:"not null;default:60" json:"duration_minutes"`
	StartTime       *time.Time `json:"start_time"`
	EndTime         *time.Time `json:"end_time"`
	CreatedAt       time.Time  `json:"created_at"`

	Problems    []Problem   `gorm:"foreignKey:ExamID" json:"problems,omitempty"`
	ExamClasses []ExamClass `gorm:"foreignKey:ExamID" json:"exam_classes,omitempty"`
}

type ExamClass struct {
	ID      uint  `gorm:"primaryKey" json:"id"`
	ExamID  uint  `gorm:"not null;index;uniqueIndex:idx_exam_class" json:"exam_id"`
	ClassID uint  `gorm:"not null;index;uniqueIndex:idx_exam_class" json:"class_id"`
	Class   Class `gorm:"foreignKey:ClassID" json:"class,omitempty"`
}
