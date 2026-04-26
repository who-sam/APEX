package leaderboard

import (
	"apex/internal/database"
	"apex/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type entry struct {
	UserID         uint    `json:"user_id"`
	StudentName    string  `json:"student_name"`
	Email          string  `json:"email"`
	Score          float64 `json:"score"`
	ExamsCompleted int     `json:"exams_completed"`
	Streak         int     `json:"streak"`
	Trend          string  `json:"trend"`
	Rank           int     `json:"rank"`
}

func GetClassLeaderboard(c *gin.Context) {
	classID := c.Query("class_id")
	period := c.DefaultQuery("period", "all")

	if classID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "class_id is required"})
		return
	}

	var memberIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("class_id = ?", classID).Pluck("user_id", &memberIDs)

	if len(memberIDs) == 0 {
		c.JSON(http.StatusOK, []entry{})
		return
	}

	c.JSON(http.StatusOK, buildLeaderboard(memberIDs, period))
}

func GetGlobalLeaderboard(c *gin.Context) {
	period := c.DefaultQuery("period", "all")

	var studentIDs []uint
	database.DB.Model(&models.User{}).Where("role = ?", "student").Pluck("id", &studentIDs)

	if len(studentIDs) == 0 {
		c.JSON(http.StatusOK, []entry{})
		return
	}

	c.JSON(http.StatusOK, buildLeaderboard(studentIDs, period))
}

func buildLeaderboard(userIDs []uint, period string) []entry {
	periodStart := getPeriodStart(period)

	type row struct {
		UserID    uint
		AvgScore  float64
		ExamCount int
	}

	var results []row
	query := database.DB.Model(&models.Submission{}).
		Select("user_id, AVG(score) as avg_score, COUNT(DISTINCT exam_id) as exam_count").
		Where("user_id IN ?", userIDs)

	if periodStart != nil {
		query = query.Where("submitted_at >= ?", *periodStart)
	}

	query.Group("user_id").Order("avg_score DESC").Scan(&results)

	var users []models.User
	database.DB.Where("id IN ?", userIDs).Find(&users)
	userMap := make(map[uint]models.User)
	for _, u := range users {
		userMap[u.ID] = u
	}

	entries := make([]entry, len(results))
	for i, r := range results {
		user := userMap[r.UserID]
		entries[i] = entry{
			UserID:         r.UserID,
			StudentName:    user.Name,
			Email:          user.Email,
			Score:          r.AvgScore,
			ExamsCompleted: r.ExamCount,
			Trend:          "same",
			Rank:           i + 1,
		}
	}

	submittedSet := make(map[uint]bool)
	for _, r := range results {
		submittedSet[r.UserID] = true
	}
	rank := len(entries) + 1
	for _, uid := range userIDs {
		if !submittedSet[uid] {
			user := userMap[uid]
			entries = append(entries, entry{
				UserID:      uid,
				StudentName: user.Name,
				Email:       user.Email,
				Rank:        rank,
				Trend:       "same",
			})
			rank++
		}
	}

	return entries
}

func getPeriodStart(period string) *time.Time {
	now := time.Now()
	switch period {
	case "week":
		t := now.AddDate(0, 0, -7)
		return &t
	case "month":
		t := now.AddDate(0, -1, 0)
		return &t
	default:
		return nil
	}
}
