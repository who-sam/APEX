package handlers

import (
	"codejudge-backend/database"
	"codejudge-backend/models"
	"encoding/csv"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetExamResults(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var submissions []models.Submission
	database.DB.Where("exam_id = ?", exam.ID).
		Preload("User").
		Preload("Problem").
		Order("submitted_at desc").
		Find(&submissions)

	// Group by student
	type StudentResult struct {
		UserID      uint                `json:"user_id"`
		Name        string              `json:"name"`
		Email       string              `json:"email"`
		Submissions []models.Submission `json:"submissions"`
		TotalScore  float64             `json:"total_score"`
		AvgScore    float64             `json:"avg_score"`
	}

	studentMap := make(map[uint]*StudentResult)
	for _, sub := range submissions {
		sr, exists := studentMap[sub.UserID]
		if !exists {
			sr = &StudentResult{
				UserID: sub.UserID,
				Name:   sub.User.Name,
				Email:  sub.User.Email,
			}
			studentMap[sub.UserID] = sr
		}
		sr.Submissions = append(sr.Submissions, sub)
		sr.TotalScore += sub.Score
	}

	results := make([]StudentResult, 0, len(studentMap))
	for _, sr := range studentMap {
		if len(sr.Submissions) > 0 {
			sr.AvgScore = sr.TotalScore / float64(len(sr.Submissions))
		}
		results = append(results, *sr)
	}

	c.JSON(http.StatusOK, results)
}

func GetClassStats(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.Where("id = ? AND teacher_id = ?", classID, teacherID).First(&class).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "class not found"})
		return
	}

	// Get member IDs
	var memberIDs []uint
	database.DB.Model(&models.ClassMember{}).Where("class_id = ?", class.ID).Pluck("user_id", &memberIDs)

	// Get exam IDs assigned to this class
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

func ExportExamResults(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.Where("id = ? AND teacher_id = ?", examID, teacherID).First(&exam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}

	var submissions []models.Submission
	database.DB.Where("exam_id = ?", exam.ID).
		Preload("User").
		Preload("Problem").
		Order("submitted_at desc").
		Find(&submissions)

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=exam_%d_results.csv", exam.ID))

	w := csv.NewWriter(c.Writer)
	w.Write([]string{"Student Name", "Email", "Problem", "Language", "Score", "Status", "Submitted At"})

	for _, sub := range submissions {
		w.Write([]string{
			sub.User.Name,
			sub.User.Email,
			sub.Problem.Title,
			sub.Language,
			fmt.Sprintf("%.1f", sub.Score),
			sub.Status,
			sub.SubmittedAt.Format("2006-01-02 15:04:05"),
		})
	}

	w.Flush()
}
