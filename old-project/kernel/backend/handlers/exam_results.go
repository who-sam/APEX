package handlers

import (
	"encoding/csv"
	"fmt"
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetExamResults(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var exam models.Exam
	if err := database.DB.First(&exam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	if exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your exam"})
		return
	}

	var submissions []models.Submission
	database.DB.Where("exam_id = ?", exam.ID).Preload("User").Preload("Problem").Find(&submissions)

	// Group by student
	type studentResult struct {
		UserID      uint                `json:"user_id"`
		Name        string              `json:"name"`
		Email       string              `json:"email"`
		Submissions []models.Submission `json:"submissions"`
		TotalScore  float64             `json:"total_score"`
		AvgScore    float64             `json:"avg_score"`
	}

	studentMap := make(map[uint]*studentResult)
	for _, sub := range submissions {
		sr, ok := studentMap[sub.UserID]
		if !ok {
			sr = &studentResult{
				UserID: sub.UserID,
				Name:   sub.User.Name,
				Email:  sub.User.Email,
			}
			studentMap[sub.UserID] = sr
		}
		sr.Submissions = append(sr.Submissions, sub)
		sr.TotalScore += sub.Score
	}

	results := make([]studentResult, 0, len(studentMap))
	for _, sr := range studentMap {
		if len(sr.Submissions) > 0 {
			sr.AvgScore = sr.TotalScore / float64(len(sr.Submissions))
		}
		results = append(results, *sr)
	}

	c.JSON(http.StatusOK, results)
}

func ExportExamResults(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var exam models.Exam
	if err := database.DB.First(&exam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	if exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your exam"})
		return
	}

	var submissions []models.Submission
	database.DB.Where("exam_id = ?", exam.ID).Preload("User").Preload("Problem").
		Order("user_id ASC, submitted_at ASC").Find(&submissions)

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=exam_%s_results.csv", id))

	writer := csv.NewWriter(c.Writer)
	writer.Write([]string{"Student Name", "Email", "Problem", "Language", "Score", "Status", "Submitted At"})

	for _, sub := range submissions {
		writer.Write([]string{
			sub.User.Name,
			sub.User.Email,
			sub.Problem.Title,
			sub.Language,
			fmt.Sprintf("%.1f", sub.Score),
			sub.Status,
			sub.SubmittedAt.Format("2006-01-02 15:04:05"),
		})
	}
	writer.Flush()
}
