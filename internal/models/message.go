package models

import "time"

type Message struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	FromID    uint      `gorm:"not null;index" json:"from_id"`
	ToID      uint      `gorm:"not null;index" json:"to_id"`
	Subject   string    `gorm:"size:255" json:"subject"`
	Body      string    `gorm:"type:text" json:"body"`
	Type      string    `gorm:"size:20;default:'direct'" json:"type"`
	Read      bool      `gorm:"default:false" json:"read"`
	Starred   bool      `gorm:"default:false" json:"starred"`
	CreatedAt time.Time `json:"created_at"`
	FromUser  User      `gorm:"foreignKey:FromID" json:"from_user,omitempty"`
}
