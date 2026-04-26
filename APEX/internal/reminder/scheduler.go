package reminder

import (
	"apex/internal/database"
	"apex/internal/email"
	"apex/internal/models"
	"apex/internal/notification"
	"fmt"
	"log"
	"time"
)

// Start launches a goroutine that periodically scans for upcoming exams and
// notifies enrolled students who opted in to exam reminders. Reminder fires
// once per exam (deduped via exams.reminder_sent_at).
func Start() {
	go func() {
		// Initial short delay to let DB settle.
		time.Sleep(15 * time.Second)
		tick := time.NewTicker(1 * time.Minute)
		defer tick.Stop()
		runOnce()
		for range tick.C {
			runOnce()
		}
	}()
}

func runOnce() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[reminder] panic: %v", r)
		}
	}()

	now := time.Now()
	cutoff := now.Add(60 * time.Minute)

	var exams []models.Exam
	if err := database.DB.
		Where("is_draft = ? AND reminder_sent_at IS NULL AND start_time IS NOT NULL AND start_time > ? AND start_time <= ?", false, now, cutoff).
		Find(&exams).Error; err != nil {
		log.Printf("[reminder] query failed: %v", err)
		return
	}

	for _, exam := range exams {
		notifyExam(exam)
	}

	emailSweep1Hour(now)
	emailSweepStart(now)
}

// emailSweep1Hour: send "starts in 1h" email for exams in [now+50, now+70] window
// where the 1h email hasn't fired yet.
func emailSweep1Hour(now time.Time) {
	low := now.Add(58 * time.Minute)
	high := now.Add(62 * time.Minute)
	var exams []models.Exam
	if err := database.DB.
		Where("is_draft = ? AND email_reminder1h_sent_at IS NULL AND start_time IS NOT NULL AND start_time BETWEEN ? AND ?", false, low, high).
		Find(&exams).Error; err != nil {
		log.Printf("[reminder:1h] query failed: %v", err)
		return
	}
	for _, exam := range exams {
		sendExamEmail(exam, "starts in about 1 hour")
		stamp := time.Now()
		database.DB.Model(&models.Exam{}).Where("id = ?", exam.ID).Update("email_reminder1h_sent_at", stamp)
	}
}

// emailSweepStart: send "starts now" email when start_time is within +/-5min and
// the start email hasn't fired yet.
func emailSweepStart(now time.Time) {
	low := now.Add(-2 * time.Minute)
	high := now.Add(2 * time.Minute)
	var exams []models.Exam
	if err := database.DB.
		Where("is_draft = ? AND email_reminder_start_sent_at IS NULL AND start_time IS NOT NULL AND start_time BETWEEN ? AND ?", false, low, high).
		Find(&exams).Error; err != nil {
		log.Printf("[reminder:start] query failed: %v", err)
		return
	}
	for _, exam := range exams {
		sendExamEmail(exam, "is starting now")
		stamp := time.Now()
		database.DB.Model(&models.Exam{}).Where("id = ?", exam.ID).Update("email_reminder_start_sent_at", stamp)
	}
}

func sendExamEmail(exam models.Exam, when string) {
	var classIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("exam_id = ?", exam.ID).Pluck("class_id", &classIDs)
	if len(classIDs) == 0 {
		return
	}
	var memberIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("class_id IN ?", classIDs).Pluck("user_id", &memberIDs)
	if len(memberIDs) == 0 {
		return
	}
	var optedIn []uint
	database.DB.Model(&models.UserProfile{}).
		Where("user_id IN ? AND notify_exam_email = ?", memberIDs, true).
		Pluck("user_id", &optedIn)
	if len(optedIn) == 0 {
		return
	}
	var users []models.User
	database.DB.Where("id IN ?", optedIn).Find(&users)
	subject := fmt.Sprintf("[APEX] \"%s\" %s", exam.Title, when)
	for _, u := range users {
		if u.Email == "" {
			continue
		}
		text := fmt.Sprintf("Hi %s,\n\nYour exam \"%s\" %s. Log in to APEX to take it.\n", u.Name, exam.Title, when)
		html := fmt.Sprintf("<p>Hi %s,</p><p>Your exam <strong>%s</strong> %s. Log in to APEX to take it.</p>", u.Name, exam.Title, when)
		_ = email.Send(u.Email, subject, html, text)
	}
}

func notifyExam(exam models.Exam) {
	// Find class IDs for this exam.
	var classIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("exam_id = ?", exam.ID).Pluck("class_id", &classIDs)
	if len(classIDs) == 0 {
		// Still mark as processed so we don't re-scan it forever.
		now := time.Now()
		database.DB.Model(&models.Exam{}).Where("id = ?", exam.ID).Update("reminder_sent_at", now)
		return
	}

	// Enrolled student IDs.
	var memberIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("class_id IN ?", classIDs).Pluck("user_id", &memberIDs)
	if len(memberIDs) == 0 {
		now := time.Now()
		database.DB.Model(&models.Exam{}).Where("id = ?", exam.ID).Update("reminder_sent_at", now)
		return
	}

	// Students opted in.
	var optedIn []uint
	database.DB.Model(&models.UserProfile{}).
		Where("user_id IN ? AND notify_exam_reminders = ?", memberIDs, true).
		Pluck("user_id", &optedIn)

	link := "/dashboard/exams"
	minutesUntil := max(int(time.Until(*exam.StartTime).Minutes()), 1)
	body := fmt.Sprintf("\"%s\" starts in about %d minute(s).", exam.Title, minutesUntil)
	for _, uid := range optedIn {
		notification.Create(uid, "exam_reminder", "Upcoming exam", body, link)
	}

	now := time.Now()
	database.DB.Model(&models.Exam{}).Where("id = ?", exam.ID).Update("reminder_sent_at", now)
}
