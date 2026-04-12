package handlers

import (
	"kernel-backend/database"
	"kernel-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AddTestCase(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	problemID := c.Param("id")

	var problem models.Problem
	if err := database.DB.First(&problem, problemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}
	var exam models.Exam
	if err := database.DB.First(&exam, problem.ExamID).Error; err != nil || exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	var tc models.TestCase
	if err := c.ShouldBindJSON(&tc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	tc.ProblemID = problem.ID

	if err := database.DB.Create(&tc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create test case"})
		return
	}
	c.JSON(http.StatusCreated, tc)
}

func UpdateTestCase(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var tc models.TestCase
	if err := database.DB.First(&tc, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test case not found"})
		return
	}
	var problem models.Problem
	if err := database.DB.First(&problem, tc.ProblemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}
	var exam models.Exam
	if err := database.DB.First(&exam, problem.ExamID).Error; err != nil || exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	var updates map[string]any
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	delete(updates, "id")
	delete(updates, "problem_id")

	database.DB.Model(&tc).Updates(updates)
	database.DB.First(&tc, id)
	c.JSON(http.StatusOK, tc)
}

func DeleteTestCase(c *gin.Context) {
	teacherID := c.GetUint("user_id")
	id := c.Param("id")

	var tc models.TestCase
	if err := database.DB.First(&tc, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "test case not found"})
		return
	}
	var problem models.Problem
	if err := database.DB.First(&problem, tc.ProblemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}
	var exam models.Exam
	if err := database.DB.First(&exam, problem.ExamID).Error; err != nil || exam.TeacherID != teacherID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized"})
		return
	}

	database.DB.Delete(&tc)
	c.JSON(http.StatusOK, gin.H{"message": "test case deleted"})
}
