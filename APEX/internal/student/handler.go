package student

import (
	"apex/internal/database"
	"apex/internal/models"
	"apex/internal/notification"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type joinClassRequest struct {
	InviteCode string `json:"invite_code" binding:"required"`
}

func JoinClass(c *gin.Context) {
	var req joinClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invite_code is required"})
		return
	}

	userID := c.GetUint("user_id")

	var class models.Class
	if err := database.DB.Where("invite_code = ?", req.InviteCode).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "invalid invite code"})
		return
	}

	var existing int64
	database.DB.Model(&models.ClassMember{}).Where("class_id = ? AND user_id = ?", class.ID, userID).Count(&existing)
	if existing > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "already a member of this class"})
		return
	}

	member := models.ClassMember{
		ClassID: class.ID,
		UserID:  userID,
	}
	if err := database.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to join class"})
		return
	}

	var student models.User
	database.DB.First(&student, userID)
	notification.Create(class.TeacherID, "class",
		"New Student Joined",
		student.Name+" joined "+class.Name,
		"/dashboard/team",
	)

	c.JSON(http.StatusOK, gin.H{"message": "joined class successfully", "class": class})
}

func GetClasses(c *gin.Context) {
	userID := c.GetUint("user_id")

	var memberships []models.ClassMember
	database.DB.Where("user_id = ?", userID).Preload("Class").Find(&memberships)

	type ClassInfo struct {
		models.Class
		MemberCount int64 `json:"member_count"`
	}

	result := make([]ClassInfo, len(memberships))
	for i, m := range memberships {
		var count int64
		database.DB.Model(&models.ClassMember{}).Where("class_id = ?", m.ClassID).Count(&count)
		result[i] = ClassInfo{Class: m.Class, MemberCount: count}
	}

	c.JSON(http.StatusOK, result)
}

func GetClass(c *gin.Context) {
	userID := c.GetUint("user_id")
	classID := c.Param("id")

	var member models.ClassMember
	if err := database.DB.Where("class_id = ? AND user_id = ?", classID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	var class models.Class
	if err := database.DB.First(&class, member.ClassID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	var count int64
	database.DB.Model(&models.ClassMember{}).Where("class_id = ?", class.ID).Count(&count)

	// Load exams assigned to this class
	var examIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("class_id = ?", class.ID).Pluck("exam_id", &examIDs)

	type ExamWithStatus struct {
		models.Exam
		Status       string `json:"status"`
		ProblemCount int64  `json:"problem_count"`
	}

	exams := []ExamWithStatus{}
	if len(examIDs) > 0 {
		var rawExams []models.Exam
		database.DB.Where("id IN ? AND is_draft = ?", examIDs, false).Order("start_time asc").Find(&rawExams)
		now := time.Now()
		for _, exam := range rawExams {
			status := "upcoming"
			if exam.StartTime != nil && exam.EndTime != nil {
				if now.After(*exam.EndTime) {
					status = "completed"
				} else if now.After(*exam.StartTime) {
					status = "active"
				}
			}
			var problemCount int64
			database.DB.Model(&models.Problem{}).Where("exam_id = ?", exam.ID).Count(&problemCount)
			exams = append(exams, ExamWithStatus{Exam: exam, Status: status, ProblemCount: problemCount})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           class.ID,
		"name":         class.Name,
		"section":      class.Section,
		"invite_code":  class.InviteCode,
		"cover_image":  class.CoverImage,
		"member_count": count,
		"created_at":   class.CreatedAt,
		"exams":        exams,
	})
}

func GetExams(c *gin.Context) {
	userID := c.GetUint("user_id")

	var classIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("user_id = ?", userID).Pluck("class_id", &classIDs)

	if len(classIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	var examIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("class_id IN ?", classIDs).Pluck("exam_id", &examIDs)

	if len(examIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	var exams []models.Exam
	database.DB.Where("id IN ? AND is_draft = ?", examIDs, false).
		Preload("ExamClasses.Class").
		Order("start_time asc").
		Find(&exams)

	now := time.Now()

	type ExamWithStatus struct {
		models.Exam
		Status       string `json:"status"`
		ProblemCount int64  `json:"problem_count"`
	}

	result := make([]ExamWithStatus, len(exams))
	for i, exam := range exams {
		status := "upcoming"
		if exam.StartTime != nil && exam.EndTime != nil {
			if now.After(*exam.EndTime) {
				status = "completed"
			} else if now.After(*exam.StartTime) {
				status = "active"
			}
		}
		var problemCount int64
		database.DB.Model(&models.Problem{}).Where("exam_id = ?", exam.ID).Count(&problemCount)
		result[i] = ExamWithStatus{Exam: exam, Status: status, ProblemCount: problemCount}
	}

	c.JSON(http.StatusOK, result)
}

func GetExam(c *gin.Context) {
	userID := c.GetUint("user_id")
	examID := c.Param("id")

	var classIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("user_id = ?", userID).Pluck("class_id", &classIDs)

	if len(classIDs) == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "not enrolled in any class"})
		return
	}

	var count int64
	database.DB.Model(&models.ExamClass{}).Where("exam_id = ? AND class_id IN ?", examID, classIDs).Count(&count)
	if count == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "exam not assigned to your class"})
		return
	}

	var exam models.Exam
	if err := database.DB.Where("id = ?", examID).
		Preload("Problems", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index asc")
		}).
		Preload("Problems.TestCases", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_sample = ?", true).Order("order_index asc")
		}).
		First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var submissions []models.Submission
	database.DB.Where("user_id = ? AND exam_id = ?", userID, exam.ID).Find(&submissions)

	c.JSON(http.StatusOK, gin.H{
		"exam":        exam,
		"submissions": submissions,
	})
}

func GetSubmissions(c *gin.Context) {
	userID := c.GetUint("user_id")

	var submissions []models.Submission
	database.DB.Where("user_id = ?", userID).
		Preload("Problem").
		Order("submitted_at desc").
		Find(&submissions)

	c.JSON(http.StatusOK, submissions)
}

func GetStats(c *gin.Context) {
	userID := c.GetUint("user_id")

	var totalSubmissions int64
	database.DB.Model(&models.Submission{}).Where("user_id = ?", userID).Count(&totalSubmissions)

	if totalSubmissions == 0 {
		c.JSON(http.StatusOK, gin.H{
			"exams_taken":       0,
			"avg_score":         0,
			"pass_rate":         0,
			"total_submissions": 0,
		})
		return
	}

	var examsTaken int64
	database.DB.Model(&models.Submission{}).
		Where("user_id = ?", userID).
		Distinct("exam_id").
		Count(&examsTaken)

	var avgScore float64
	database.DB.Model(&models.Submission{}).
		Where("user_id = ?", userID).
		Select("COALESCE(AVG(score), 0)").
		Scan(&avgScore)

	var passCount int64
	database.DB.Model(&models.Submission{}).
		Where("user_id = ? AND score >= 60", userID).
		Count(&passCount)

	passRate := float64(passCount) / float64(totalSubmissions) * 100.0

	c.JSON(http.StatusOK, gin.H{
		"exams_taken":       examsTaken,
		"avg_score":         avgScore,
		"pass_rate":         passRate,
		"total_submissions": totalSubmissions,
	})
}

func GetPerformance(c *gin.Context) {
	userID := c.GetUint("user_id")

	sixMonthsAgo := time.Now().AddDate(0, -6, 0)

	type MonthlyScore struct {
		Month    string  `json:"month"`
		AvgScore float64 `json:"avg_score"`
	}

	var results []MonthlyScore
	database.DB.Model(&models.Submission{}).
		Where("user_id = ? AND submitted_at >= ?", userID, sixMonthsAgo).
		Select("TO_CHAR(submitted_at, 'YYYY-MM') as month, AVG(score) as avg_score").
		Group("month").
		Order("month asc").
		Scan(&results)

	c.JSON(http.StatusOK, results)
}

func GetPractice(c *gin.Context) {
	userID := c.GetUint("user_id")

	var classIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("user_id = ?", userID).Pluck("class_id", &classIDs)

	if len(classIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	var examIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("class_id IN ?", classIDs).Pluck("exam_id", &examIDs)

	if len(examIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	var exams []models.Exam
	database.DB.Where("id IN ? AND is_practice = ?", examIDs, true).
		Preload("Problems").
		Order("created_at desc").
		Find(&exams)

	c.JSON(http.StatusOK, exams)
}
