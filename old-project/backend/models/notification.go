package models

import "time"

type Notification struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	Type        string    `gorm:"size:20;not null" json:"type"`
	Title       string    `gorm:"size:255;not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	LinkTo      string    `gorm:"size:255" json:"link_to"`
	Read        bool      `gorm:"default:false" json:"read"`
	CreatedAt   time.Time `json:"created_at"`
}
