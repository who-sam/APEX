package models

type UserProfile struct {
	ID                  uint   `gorm:"primaryKey" json:"id"`
	UserID              uint   `gorm:"uniqueIndex" json:"user_id"`
	Bio                 string `gorm:"type:text" json:"bio"`
	NotifyEmail         bool   `gorm:"default:true" json:"notify_email"`
	NotifyPush          bool   `gorm:"default:true" json:"notify_push"`
	NotifyExamReminders bool   `gorm:"default:true" json:"notify_exam_reminders"`
	NotifyResults       bool   `gorm:"default:false" json:"notify_results"`
}
