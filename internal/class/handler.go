package class

import (
	"apex/internal/database"
	"apex/internal/models"
	"apex/internal/notification"
	"crypto/rand"
	"fmt"
	"math"
	"math/big"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

const inviteCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

func generateInviteCode() string {
	code := make([]byte, 8)
	for i := range code {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(inviteCodeChars))))
		code[i] = inviteCodeChars[n.Int64()]
	}
	return string(code)
}

type createClassRequest struct {
	Name    string `json:"name" binding:"required"`
	Section string `json:"section"`
}

func CreateClass(c *gin.Context) {
	var req createClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	teacherID := c.GetUint("user_id")

	var inviteCode string
	for {
		inviteCode = generateInviteCode()
		var count int64
		database.DB.Model(&models.Class{}).Where("invite_code = ?", inviteCode).Count(&count)
		if count == 0 {
			break
		}
	}

	// Seed passing threshold from teacher's profile preference if set.
	threshold := 60
	var prof models.UserProfile
	if err := database.DB.Where("user_id = ?", teacherID).First(&prof).Error; err == nil && prof.DefaultPassingThreshold > 0 {
		threshold = prof.DefaultPassingThreshold
	}

	class := models.Class{
		TeacherID:        teacherID,
		Name:             req.Name,
		Section:          req.Section,
		InviteCode:       inviteCode,
		PassingThreshold: threshold,
	}

	if err := database.DB.Create(&class).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create class"})
		return
	}

	c.JSON(http.StatusCreated, class)
}

func GetClasses(c *gin.Context) {
	teacherID := c.GetUint("user_id")

	type ClassWithCount struct {
		models.Class
		MemberCount int64 `json:"member_count"`
		ExamCount   int64 `json:"exam_count"`
	}

	var classes []models.Class
	database.DB.Where("teacher_id = ?", teacherID).Order("created_at desc").Find(&classes)

	result := make([]ClassWithCount, len(classes))
	for i, cls := range classes {
		var memberCount int64
		database.DB.Model(&models.ClassMember{}).Where("class_id = ?", cls.ID).Count(&memberCount)
		var examCount int64
		database.DB.Model(&models.ExamClass{}).Where("class_id = ?", cls.ID).Count(&examCount)
		result[i] = ClassWithCount{Class: cls, MemberCount: memberCount, ExamCount: examCount}
	}

	c.JSON(http.StatusOK, result)
}

func GetClass(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	var members []models.ClassMember
	database.DB.Where("class_id = ?", class.ID).Preload("User").Find(&members)

	// Get exam IDs for this class
	var examIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("class_id = ?", class.ID).Pluck("exam_id", &examIDs)

	type memberWithScores struct {
		models.ClassMember
		ExamScores map[uint]float64 `json:"exam_scores"`
		Avg        *float64         `json:"avg"`
	}

	enriched := make([]memberWithScores, len(members))
	for i, m := range members {
		enriched[i].ClassMember = m
		enriched[i].ExamScores = map[uint]float64{}

		if len(examIDs) == 0 {
			continue
		}

		// Compute weighted score per exam from submissions
		var subs []models.Submission
		database.DB.Where("user_id = ? AND exam_id IN ?", m.UserID, examIDs).Find(&subs)

		// Group subs by exam
		subsByExam := map[uint][]models.Submission{}
		for _, s := range subs {
			subsByExam[s.ExamID] = append(subsByExam[s.ExamID], s)
		}

		var total float64
		var count int
		for eid, examSubs := range subsByExam {
			// Load problems for this exam
			var probs []models.Problem
			database.DB.Where("exam_id = ?", eid).Find(&probs)
			if len(probs) == 0 {
				continue
			}

			subByProblem := map[uint]models.Submission{}
			for _, s := range examSubs {
				subByProblem[s.ProblemID] = s
			}

			var earnedPts, totalPts float64
			for _, p := range probs {
				pts := float64(p.Points)
				if pts <= 0 {
					pts = 10
				}
				totalPts += pts
				if s, ok := subByProblem[p.ID]; ok {
					earnedPts += s.Score / 100.0 * pts
				}
			}

			if totalPts > 0 {
				pct := earnedPts / totalPts * 100
				enriched[i].ExamScores[eid] = math.Round(pct*100) / 100
				total += pct
				count++
			}
		}

		if count > 0 {
			avg := math.Round(total/float64(count)*100) / 100
			enriched[i].Avg = &avg
		}
	}

	// Load exams assigned to this class with computed status
	type examWithStatus struct {
		models.Exam
		Status string `json:"status"`
	}
	var classExams []models.Exam
	if len(examIDs) > 0 {
		database.DB.Where("id IN ?", examIDs).Order("created_at asc").Find(&classExams)
	}
	now := time.Now()
	examsOut := make([]examWithStatus, len(classExams))
	for i, e := range classExams {
		status := "upcoming"
		if e.IsDraft {
			status = "draft"
		} else if e.StartTime != nil {
			if e.EndTime != nil && now.After(*e.EndTime) {
				status = "completed"
			} else if now.After(*e.StartTime) {
				status = "active"
			}
		}
		examsOut[i] = examWithStatus{Exam: e, Status: status}
	}

	c.JSON(http.StatusOK, gin.H{
		"class":   class,
		"members": enriched,
		"exams":   examsOut,
	})
}

type updateClassRequest struct {
	Name             *string `json:"name"`
	Section          *string `json:"section"`
	CoverImage       *string `json:"cover_image"`
	GradesAnnounced  *bool   `json:"grades_announced"`
	PassingThreshold *int    `json:"passing_threshold"`
	BlockAnnounceWithPending *bool `json:"block_announce_with_pending"`
}

func UpdateClass(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	var req updateClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Section != nil {
		updates["section"] = *req.Section
	}
	if req.CoverImage != nil {
		updates["cover_image"] = *req.CoverImage
	}
	if req.BlockAnnounceWithPending != nil {
		updates["block_announce_with_pending"] = *req.BlockAnnounceWithPending
	}
	if req.GradesAnnounced != nil {
		// Read teacher's global preference instead of per-class.
		var prof models.UserProfile
		blockAnnounce := true
		if err := database.DB.Where("user_id = ?", teacherID).First(&prof).Error; err == nil {
			blockAnnounce = prof.BlockAnnounceWithPending
		}
		if *req.GradesAnnounced && blockAnnounce {
			// Guard: block announcing if any submission in this class is still
			// awaiting manual grading (pending_review / pending / running).
			var examIDs []uint
			database.DB.Model(&models.ExamClass{}).Where("class_id = ?", class.ID).Pluck("exam_id", &examIDs)
			if len(examIDs) > 0 {
				var pendingCount int64
				database.DB.Model(&models.Submission{}).
					Where("exam_id IN ? AND status IN ?", examIDs, []string{"pending_review", "pending", "running"}).
					Count(&pendingCount)
				if pendingCount > 0 {
					c.JSON(http.StatusBadRequest, gin.H{
						"error":         fmt.Sprintf("Cannot announce: %d submission(s) still need grading. Grade all written answers first.", pendingCount),
						"pending_count": pendingCount,
					})
					return
				}
			}
		}
		updates["grades_announced"] = *req.GradesAnnounced
	}
	if req.PassingThreshold != nil {
		updates["passing_threshold"] = *req.PassingThreshold
	}

	if len(updates) > 0 {
		database.DB.Model(&class).Updates(updates)
	}

	// Result alerts: notify students opted-in to result alerts when grades flip true.
	if req.GradesAnnounced != nil && *req.GradesAnnounced && !class.GradesAnnounced {
		var memberIDs []uint
		database.DB.Model(&models.ClassMember{}).Where("class_id = ?", class.ID).Pluck("user_id", &memberIDs)
		if len(memberIDs) > 0 {
			var optedIn []uint
			database.DB.Model(&models.UserProfile{}).
				Where("user_id IN ? AND notify_results = ?", memberIDs, true).
				Pluck("user_id", &optedIn)
			link := fmt.Sprintf("/dashboard/courses/%d", class.ID)
			body := fmt.Sprintf("Grades for %s are now available.", class.Name)
			for _, uid := range optedIn {
				notification.Create(uid, "result", "Grades announced", body, link)
			}
		}
	}

	database.DB.First(&class, class.ID)
	c.JSON(http.StatusOK, class)
}

func DeleteClass(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	tx := database.DB.Begin()
	if err := tx.Where("class_id = ?", classID).Delete(&models.ClassMember{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete class members"})
		return
	}
	if err := tx.Where("class_id = ?", classID).Delete(&models.ExamClass{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete exam-class links"})
		return
	}
	if err := tx.Where("class_id = ?", classID).Delete(&models.Announcement{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete announcements"})
		return
	}
	if err := tx.Delete(&class).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete class"})
		return
	}
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to commit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "class deleted"})
}

func GetClassStats(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	var memberIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("class_id = ?", class.ID).Pluck("user_id", &memberIDs)

	var examIDs []uint
	database.DB.Model(&models.ExamClass{}).Where("class_id = ?", class.ID).Pluck("exam_id", &examIDs)

	var totalSubmissions int64
	var avgScore float64
	var passCount int64

	if len(memberIDs) > 0 && len(examIDs) > 0 {
		database.DB.Model(&models.Submission{}).
			Where("user_id IN ? AND exam_id IN ?", memberIDs, examIDs).
			Count(&totalSubmissions)

		if totalSubmissions > 0 {
			var scoreSum float64
			database.DB.Model(&models.Submission{}).
				Where("user_id IN ? AND exam_id IN ?", memberIDs, examIDs).
				Select("COALESCE(SUM(score), 0)").
				Scan(&scoreSum)
			avgScore = scoreSum / float64(totalSubmissions)

			database.DB.Model(&models.Submission{}).
				Where("user_id IN ? AND exam_id IN ? AND status = ?", memberIDs, examIDs, "accepted").
				Count(&passCount)
		}
	}

	passRate := 0.0
	if totalSubmissions > 0 {
		passRate = float64(passCount) / float64(totalSubmissions) * 100.0
	}

	c.JSON(http.StatusOK, gin.H{
		"class":             class,
		"member_count":      len(memberIDs),
		"exam_count":        len(examIDs),
		"total_submissions": totalSubmissions,
		"avg_score":         avgScore,
		"pass_rate":         passRate,
	})
}

func RemoveClassMember(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")
	userID := c.Param("userId")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	result := database.DB.Where("class_id = ? AND user_id = ?", class.ID, userID).Delete(&models.ClassMember{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove member"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "member not found in class"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "member removed"})
}
