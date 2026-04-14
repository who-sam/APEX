package teacher

import (
	"apex/internal/database"
	"apex/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type dashboardResponse struct {
	TotalStudents    int64              `json:"total_students"`
	ActiveExams      int64              `json:"active_exams"`
	TotalClasses     int64              `json:"total_classes"`
	AverageScore     float64            `json:"average_score"`
	ActiveExamList   []activeExamInfo   `json:"active_exam_list"`
	RecentActivity   []activityItem     `json:"recent_activity"`
	ClassPerformance []classPerformance `json:"class_performance"`
}

type activeExamInfo struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	ClassName   string `json:"class_name"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	Submissions int64  `json:"submissions"`
	Students    int64  `json:"students"`
}

type activityItem struct {
	Type        string    `json:"type"`
	Description string    `json:"description"`
	Timestamp   time.Time `json:"timestamp"`
}

type classPerformance struct {
	ClassID      uint    `json:"class_id"`
	ClassName    string  `json:"class_name"`
	AverageScore float64 `json:"average_score"`
	StudentCount int64   `json:"student_count"`
}

func GetDashboard(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	var resp dashboardResponse

	database.DB.Model(&models.Class{}).Where("teacher_id = ?", teacherID).Count(&resp.TotalClasses)

	var classIDs []uint
	database.DB.Model(&models.Class{}).Where("teacher_id = ?", teacherID).Pluck("id", &classIDs)

	if len(classIDs) > 0 {
		database.DB.Model(&models.ClassMember{}).
			Where("class_id IN ?", classIDs).
			Distinct("user_id").
			Count(&resp.TotalStudents)
	}

	now := time.Now()
	var exams []models.Exam
	database.DB.Where("teacher_id = ?", teacherID).Find(&exams)

	var activeCount int64
	for _, exam := range exams {
		if exam.StartTime != nil && exam.EndTime != nil {
			if now.After(*exam.StartTime) && now.Before(*exam.EndTime) {
				activeCount++
			}
		}
	}
	resp.ActiveExams = activeCount

	resp.ActiveExamList = []activeExamInfo{}
	for _, exam := range exams {
		isActive := false
		if exam.StartTime != nil && exam.EndTime != nil {
			isActive = now.After(*exam.StartTime) && now.Before(*exam.EndTime)
		}
		if !isActive {
			continue
		}

		var ecs []models.ExamClass
		className := ""
		database.DB.Where("exam_id = ?", exam.ID).Preload("Class").Limit(1).Find(&ecs)
		if len(ecs) > 0 {
			className = ecs[0].Class.Name
		}

		var subCount int64
		database.DB.Model(&models.Submission{}).Where("exam_id = ?", exam.ID).Count(&subCount)

		var studentCount int64
		database.DB.Model(&models.Submission{}).Where("exam_id = ?", exam.ID).Distinct("user_id").Count(&studentCount)

		startStr, endStr := "", ""
		if exam.StartTime != nil {
			startStr = exam.StartTime.Format(time.RFC3339)
		}
		if exam.EndTime != nil {
			endStr = exam.EndTime.Format(time.RFC3339)
		}

		resp.ActiveExamList = append(resp.ActiveExamList, activeExamInfo{
			ID:          exam.ID,
			Title:       exam.Title,
			ClassName:   className,
			StartTime:   startStr,
			EndTime:     endStr,
			Submissions: subCount,
			Students:    studentCount,
		})
	}

	var examIDs []uint
	database.DB.Model(&models.Exam{}).Where("teacher_id = ?", teacherID).Pluck("id", &examIDs)
	if len(examIDs) > 0 {
		database.DB.Model(&models.Submission{}).
			Where("exam_id IN ?", examIDs).
			Select("COALESCE(AVG(score), 0)").
			Scan(&resp.AverageScore)
	}

	var recentSubs []models.Submission
	if len(examIDs) > 0 {
		database.DB.Where("exam_id IN ?", examIDs).
			Preload("User").
			Preload("Problem").
			Order("submitted_at desc").
			Limit(10).
			Find(&recentSubs)
	}

	resp.RecentActivity = make([]activityItem, len(recentSubs))
	for i, sub := range recentSubs {
		resp.RecentActivity[i] = activityItem{
			Type:        "submission",
			Description: sub.User.Name + " submitted " + sub.Problem.Title,
			Timestamp:   sub.SubmittedAt,
		}
	}

	var classes []models.Class
	database.DB.Where("teacher_id = ?", teacherID).Find(&classes)

	resp.ClassPerformance = make([]classPerformance, 0, len(classes))
	for _, cls := range classes {
		var memberIDs []uint
		database.DB.Model(&models.ClassMember{}).Where("class_id = ?", cls.ID).Pluck("user_id", &memberIDs)
		if len(memberIDs) == 0 {
			continue
		}

		var classExamIDs []uint
		database.DB.Model(&models.ExamClass{}).Where("class_id = ?", cls.ID).Pluck("exam_id", &classExamIDs)

		var avgScore float64
		if len(classExamIDs) > 0 {
			database.DB.Model(&models.Submission{}).
				Where("exam_id IN ? AND user_id IN ?", classExamIDs, memberIDs).
				Select("COALESCE(AVG(score), 0)").
				Scan(&avgScore)
		}

		resp.ClassPerformance = append(resp.ClassPerformance, classPerformance{
			ClassID:      cls.ID,
			ClassName:    cls.Name,
			AverageScore: avgScore,
			StudentCount: int64(len(memberIDs)),
		})
	}

	c.JSON(http.StatusOK, resp)
}
