package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetTeacherDashboard(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	// Total classes
	var totalClasses int64
	database.DB.Model(&models.Class{}).Where("teacher_id = ?", teacherID).Count(&totalClasses)

	// Total unique students across all classes
	var classIDs []uint
	database.DB.Model(&models.Class{}).Where("teacher_id = ?", teacherID).Pluck("id", &classIDs)

	var totalStudents int64
	if len(classIDs) > 0 {
		database.DB.Model(&models.ClassMember{}).
			Where("class_id IN ?", classIDs).
			Distinct("user_id").Count(&totalStudents)
	}

	// Active exams
	now := time.Now()
	var activeExams int64
	database.DB.Model(&models.Exam{}).
		Where("teacher_id = ? AND start_time <= ? AND end_time >= ?", teacherID, now, now).
		Count(&activeExams)

	// Average score across all teacher's exams
	var examIDs []uint
	database.DB.Model(&models.Exam{}).Where("teacher_id = ?", teacherID).Pluck("id", &examIDs)

	var avgScore float64
	if len(examIDs) > 0 {
		var scoreResult struct{ Avg float64 }
		database.DB.Model(&models.Submission{}).
			Select("COALESCE(AVG(score), 0) as avg").
			Where("exam_id IN ?", examIDs).
			Scan(&scoreResult)
		avgScore = scoreResult.Avg
	}

	// Active exam list
	var activeExamList []models.Exam
	database.DB.Where("teacher_id = ? AND start_time <= ? AND end_time >= ?", teacherID, now, now).
		Find(&activeExamList)

	// Recent activity: last 10 submissions across teacher's exams
	var recentActivity []models.Submission
	if len(examIDs) > 0 {
		database.DB.Where("exam_id IN ?", examIDs).
			Preload("User").Preload("Problem").
			Order("submitted_at DESC").
			Limit(10).
			Find(&recentActivity)
	}

	// Class performance
	type classPerf struct {
		ClassName string  `json:"class_name"`
		ClassID   uint    `json:"class_id"`
		AvgScore  float64 `json:"avg_score"`
	}
	var classPerformance []classPerf
	if len(classIDs) > 0 {
		var classes []models.Class
		database.DB.Where("id IN ?", classIDs).Find(&classes)
		for _, cl := range classes {
			var memberIDs []uint
			database.DB.Model(&models.ClassMember{}).Where("class_id = ?", cl.ID).Pluck("user_id", &memberIDs)
			if len(memberIDs) == 0 {
				classPerformance = append(classPerformance, classPerf{ClassName: cl.Name, ClassID: cl.ID})
				continue
			}
			var sr struct{ Avg float64 }
			database.DB.Model(&models.Submission{}).
				Select("COALESCE(AVG(score), 0) as avg").
				Where("user_id IN ?", memberIDs).
				Scan(&sr)
			classPerformance = append(classPerformance, classPerf{ClassName: cl.Name, ClassID: cl.ID, AvgScore: sr.Avg})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total_students":    totalStudents,
		"active_exams":      activeExams,
		"total_classes":     totalClasses,
		"average_score":     avgScore,
		"active_exam_list":  activeExamList,
		"recent_activity":   recentActivity,
		"class_performance": classPerformance,
	})
}
