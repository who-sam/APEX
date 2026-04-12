package models

import "time"

type Team struct {
	ID        uint         `gorm:"primaryKey" json:"id"`
	Name      string       `gorm:"size:255;not null" json:"name"`
	ClassID   uint         `json:"class_id"`
	CreatedAt time.Time    `json:"created_at"`
	Members   []TeamMember `gorm:"foreignKey:TeamID" json:"members,omitempty"`
}

type TeamMember struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	TeamID uint   `gorm:"not null;index" json:"team_id"`
	UserID uint   `gorm:"not null;index" json:"user_id"`
	Role   string `gorm:"size:20;default:'member'" json:"role"`
	User   User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
