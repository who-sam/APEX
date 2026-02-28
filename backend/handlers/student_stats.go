package handlers

import (
	"codejudge-backend/database"
	"codejudge-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func GetStudentStats(c *gin.Context) {
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

	// Count distinct exams taken
	var examsTaken int64
	database.DB.Model(&models.Submission{}).
		Where("user_id = ?", userID).
		Distinct("exam_id").
		Count(&examsTaken)

	// Average score
	var avgScore float64
	database.DB.Model(&models.Submission{}).
		Where("user_id = ?", userID).
		Select("COALESCE(AVG(score), 0)").
		Scan(&avgScore)

	// Pass rate (score >= 60)
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

func GetStudentPerformance(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Last 6 months
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
