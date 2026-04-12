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
