package models

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"size:255;uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"type:text;not null" json:"-"`
	Role         string    `gorm:"size:20;not null" json:"role"`
	Name         string    `gorm:"size:255;not null" json:"name"`
	CreatedAt    time.Time `json:"created_at"`
}

type UserProfile struct {
	ID                  uint   `gorm:"primaryKey" json:"id"`
	UserID              uint   `gorm:"uniqueIndex" json:"user_id"`
	Bio                 string `gorm:"type:text" json:"bio"`
	AvatarURL           string `gorm:"size:512" json:"avatar_url"`
	NotifyEmail         bool   `gorm:"default:true" json:"notify_email"`
	NotifyPush          bool   `gorm:"default:true" json:"notify_push"`
	NotifyExamReminders bool   `gorm:"default:true" json:"notify_exam_reminders"`
	NotifyResults       bool   `gorm:"default:false" json:"notify_results"`
}
