package exam

import (
	"apex/internal/database"
	"apex/internal/models"
	"apex/internal/notification"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ResetExamAttempts wipes student progress for the given exam so students
// can re-enter after a destructive teacher edit (testcase or MCQ-answer
// change, problem deletion, etc). Also stamps exams.reset_at and
// fans out a notification to every enrolled student.
//
// Safe to call on drafts too (no attempts = no-op apart from the stamp).
func ResetExamAttempts(examID uint) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var exam models.Exam
		if err := tx.First(&exam, examID).Error; err != nil {
			return err
		}

		var attemptCount int64
		tx.Model(&models.ExamAttempt{}).Where("exam_id = ?", examID).Count(&attemptCount)
		hadAttempts := attemptCount > 0

		var subIDs []uint
		tx.Model(&models.Submission{}).Where("exam_id = ?", examID).Pluck("id", &subIDs)
		if len(subIDs) > 0 {
			if err := tx.Where("submission_id IN ?", subIDs).Delete(&models.TestResult{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("exam_id = ?", examID).Delete(&models.Submission{}).Error; err != nil {
			return err
		}
		if err := tx.Where("exam_id = ?", examID).Delete(&models.ExamAttempt{}).Error; err != nil {
			return err
		}

		now := time.Now()
		if err := tx.Model(&models.Exam{}).Where("id = ?", examID).Update("reset_at", now).Error; err != nil {
			return err
		}
		exam.ResetAt = &now

		// Un-announce grades for the classes this exam belongs to — old
		// announced scores are now invalid. Class-level flag, so sibling
		// exams in the same class also get un-announced; teacher must
		// re-announce when ready.
		var classIDs []uint
		tx.Model(&models.ExamClass{}).Where("exam_id = ?", examID).Pluck("class_id", &classIDs)
		if len(classIDs) > 0 {
			if err := tx.Model(&models.Class{}).Where("id IN ?", classIDs).Update("grades_announced", false).Error; err != nil {
				return err
			}
		}

		// Only notify if there were actual attempts to reset. Keeps the
		// replace-all save flow from fanning out one notification per
		// deleted problem.
		if !hadAttempts {
			return nil
		}
		if len(classIDs) > 0 {
			var userIDs []uint
			tx.Model(&models.ClassMember{}).Where("class_id IN ?", classIDs).Pluck("user_id", &userIDs)
			link := fmt.Sprintf("/dashboard/exam/%d/take", examID)
			desc := fmt.Sprintf("Exam '%s' was updated by your teacher. Your attempt has been reset — you can re-enter.", exam.Title)
			for _, uid := range userIDs {
				notification.Create(uid, "exam_reset", "Exam updated", desc, link)
			}
		}
		return nil
	})
}
