package models

import "time"

type Class struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	TeacherID  uint      `gorm:"not null;index" json:"teacher_id"`
	Teacher    User      `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	Name       string    `gorm:"size:255;not null" json:"name"`
	Section    string    `gorm:"size:100" json:"section"`
	InviteCode string    `gorm:"size:8;uniqueIndex;not null" json:"invite_code"`
	CoverImage       string    `gorm:"type:text" json:"cover_image,omitempty"`
	GradesAnnounced  bool      `gorm:"not null;default:false" json:"grades_announced"`
	PassingThreshold int       `gorm:"not null;default:60" json:"passing_threshold"`
	BlockAnnounceWithPending bool `gorm:"not null;default:true" json:"block_announce_with_pending"`
	CreatedAt        time.Time `json:"created_at"`

	Members []ClassMember `gorm:"foreignKey:ClassID" json:"members,omitempty"`
}

type ClassMember struct {
	ID       uint      `gorm:"primaryKey" json:"id"`
	ClassID  uint      `gorm:"not null;index;uniqueIndex:idx_class_user" json:"class_id"`
	Class    Class     `gorm:"foreignKey:ClassID" json:"-"`
	UserID   uint      `gorm:"not null;index;uniqueIndex:idx_class_user" json:"user_id"`
	User     User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	JoinedAt time.Time `gorm:"autoCreateTime" json:"joined_at"`
}
