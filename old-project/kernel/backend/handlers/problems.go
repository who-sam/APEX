package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AddProblem(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	examID := c.Param("id")

	var exam models.Exam
	if err := database.DB.First(&exam, examID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	if exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your exam"})
		return
	}

	var problem models.Problem
	if err := c.ShouldBindJSON(&problem); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	problem.ExamID = exam.ID
	if problem.Type == "" {
		problem.Type = "coding"
	}
	if problem.Points == 0 {
		problem.Points = 10
	}
	if problem.Difficulty == "" {
		problem.Difficulty = "medium"
	}
	if problem.TimeLimitMs == 0 {
		problem.TimeLimitMs = 2000
	}
	if problem.MemoryLimitKb == 0 {
		problem.MemoryLimitKb = 262144
	}
	if problem.MaxWordCount == 0 {
		problem.MaxWordCount = 500
	}

	if err := database.DB.Create(&problem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create problem"})
		return
	}
	c.JSON(http.StatusCreated, problem)
}

func GetProblem(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var problem models.Problem
	if err := database.DB.
		Preload("TestCases", func(db *gorm.DB) *gorm.DB { return db.Order("order_index ASC") }).
		First(&problem, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}

	var exam models.Exam
	if err := database.DB.First(&exam, problem.ExamID).Error; err != nil || exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your problem"})
		return
	}

	c.JSON(http.StatusOK, problem)
}

func UpdateProblem(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var problem models.Problem
	if err := database.DB.First(&problem, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}

	var exam models.Exam
	if err := database.DB.First(&exam, problem.ExamID).Error; err != nil || exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your problem"})
		return
	}

	var updates map[string]any
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	delete(updates, "id")
	delete(updates, "exam_id")

	database.DB.Model(&problem).Updates(updates)
	database.DB.Preload("TestCases", func(db *gorm.DB) *gorm.DB { return db.Order("order_index ASC") }).First(&problem, id)
	c.JSON(http.StatusOK, problem)
}

func DeleteProblem(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var problem models.Problem
	if err := database.DB.First(&problem, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}

	var exam models.Exam
	if err := database.DB.First(&exam, problem.ExamID).Error; err != nil || exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your problem"})
		return
	}

	database.DB.Where("problem_id = ?", problem.ID).Delete(&models.TestCase{})
	database.DB.Delete(&problem)
	c.JSON(http.StatusOK, gin.H{"message": "problem deleted"})
}
