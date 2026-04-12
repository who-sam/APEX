package notification

import (
	"apex/internal/database"
	"apex/internal/models"
)

func Create(userID uint, notifType, title, description, linkTo string) {
	notif := models.Notification{
		UserID:      userID,
		Type:        notifType,
		Title:       title,
		Description: description,
		LinkTo:      linkTo,
	}
	database.DB.Create(&notif)
}
