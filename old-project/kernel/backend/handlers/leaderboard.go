package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
)

func GetLeaderboard(c *gin.Context) {
	classID := c.Query("class_id")
	period := c.Query("period")

	if classID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "class_id is required"})
		return
	}

	var memberIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("class_id = ?", classID).Pluck("user_id", &memberIDs)
	if len(memberIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	c.JSON(http.StatusOK, buildLeaderboard(memberIDs, period))
}

func GetGlobalLeaderboard(c *gin.Context) {
	period := c.Query("period")

	var studentIDs []uint
	database.DB.Model(&models.User{}).Where("role = ?", "student").Pluck("id", &studentIDs)
	if len(studentIDs) == 0 {
		c.JSON(http.StatusOK, []any{})
		return
	}

	c.JSON(http.StatusOK, buildLeaderboard(studentIDs, period))
}

type leaderboardEntry struct {
	UserID         uint    `json:"user_id"`
	StudentName    string  `json:"student_name"`
	Email          string  `json:"email"`
	Score          float64 `json:"score"`
	ExamsCompleted int64   `json:"exams_completed"`
	Streak         int     `json:"streak"`
	Trend          string  `json:"trend"`
	Rank           int     `json:"rank"`
}

func buildLeaderboard(userIDs []uint, period string) []leaderboardEntry {
	query := database.DB.Model(&models.Submission{}).Where("user_id IN ?", userIDs)

	switch period {
	case "week":
		query = query.Where("submitted_at >= ?", time.Now().AddDate(0, 0, -7))
	case "month":
		query = query.Where("submitted_at >= ?", time.Now().AddDate(0, -1, 0))
	}

	type userScore struct {
		UserID         uint
		AvgScore       float64
		ExamsCompleted int64
	}

	var scores []userScore
	query.Select("user_id, AVG(score) as avg_score, COUNT(DISTINCT exam_id) as exams_completed").
		Group("user_id").
		Scan(&scores)

	scoreMap := make(map[uint]userScore)
	for _, s := range scores {
		scoreMap[s.UserID] = s
	}

	// Build entries for all users
	var users []models.User
	database.DB.Where("id IN ?", userIDs).Find(&users)

	entries := make([]leaderboardEntry, 0, len(users))
	for _, u := range users {
		s := scoreMap[u.ID]
		entries = append(entries, leaderboardEntry{
			UserID:         u.ID,
			StudentName:    u.Name,
			Email:          u.Email,
			Score:          s.AvgScore,
			ExamsCompleted: s.ExamsCompleted,
			Streak:         0,
			Trend:          "stable",
		})
	}

	// Sort by score desc
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Score > entries[j].Score
	})

	// Assign ranks
	for i := range entries {
		entries[i].Rank = i + 1
	}

	return entries
}
