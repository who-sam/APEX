package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetStudentStats(c *gin.Context) {
	userID := c.GetUint("user_id")

	var totalSubmissions int64
	database.DB.Model(&models.Submission{}).Where("user_id = ?", userID).Count(&totalSubmissions)

	var examsTaken int64
	database.DB.Model(&models.Submission{}).Where("user_id = ?", userID).
		Distinct("exam_id").Count(&examsTaken)

	var avgResult struct{ Avg float64 }
	database.DB.Model(&models.Submission{}).
		Select("COALESCE(AVG(score), 0) as avg").
		Where("user_id = ?", userID).
		Scan(&avgResult)

	var passRate float64
	if totalSubmissions > 0 {
		var passCount int64
		database.DB.Model(&models.Submission{}).
			Where("user_id = ? AND score >= 60", userID).
			Count(&passCount)
		passRate = float64(passCount) / float64(totalSubmissions) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"exams_taken":       examsTaken,
		"avg_score":         avgResult.Avg,
		"pass_rate":         passRate,
		"total_submissions": totalSubmissions,
	})
}

func GetStudentPerformance(c *gin.Context) {
	userID := c.GetUint("user_id")

	type monthScore struct {
		Month    string  `json:"month"`
		AvgScore float64 `json:"avg_score"`
	}

	var results []monthScore
	database.DB.Model(&models.Submission{}).
		Select("TO_CHAR(submitted_at, 'YYYY-MM') as month, AVG(score) as avg_score").
		Where("user_id = ? AND submitted_at >= NOW() - INTERVAL '6 months'", userID).
		Group("month").
		Order("month ASC").
		Scan(&results)

	c.JSON(http.StatusOK, results)
}
