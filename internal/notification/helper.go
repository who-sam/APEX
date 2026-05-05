package notification

import (
	"apex/internal/database"
	"apex/internal/email"
	"apex/internal/models"
	"fmt"
	"html"
)

func Create(userID uint, notifType, title, description, linkTo string) {
	notif := models.Notification{
		UserID:      userID,
		Type:        notifType,
		Title:       title,
		Description: description,
		LinkTo:      linkTo,
	}
	if err := database.DB.Create(&notif).Error; err != nil {
		return
	}

	// Async email if user opted in.
	go func() {
		var prof models.UserProfile
		if err := database.DB.Where("user_id = ?", userID).First(&prof).Error; err != nil {
			return
		}
		if !prof.NotifyEmail {
			return
		}
		var user models.User
		if err := database.DB.First(&user, userID).Error; err != nil {
			return
		}
		if user.Email == "" {
			return
		}
		subject := "[APEX] " + title
		text := fmt.Sprintf("%s\n\n%s\n", title, description)
		body := fmt.Sprintf("<p><strong>%s</strong></p><p>%s</p>",
			html.EscapeString(title), html.EscapeString(description))
		_ = email.Send(user.Email, subject, body, text)
	}()
}
