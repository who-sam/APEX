package models

import "time"

type Announcement struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ClassID   uint      `gorm:"not null;index" json:"class_id"`
	TeacherID uint      `gorm:"not null;index" json:"teacher_id"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Body      string    `gorm:"type:text" json:"body"`
	Attachments string  `gorm:"type:jsonb" json:"attachments"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
