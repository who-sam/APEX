package handlers

import (
	"kernel-backend/grading"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Execute(c *gin.Context) {
	var req struct {
		Language string `json:"language" binding:"required"`
		Code     string `json:"code" binding:"required"`
		Stdin    string `json:"stdin"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "language and code are required"})
		return
	}

	if _, ok := grading.GetLanguageID(req.Language); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported language"})
		return
	}

	result := grading.RunCode(req.Code, req.Language, req.Stdin)
	c.JSON(http.StatusOK, gin.H{
		"stdout":         result.Stdout,
		"stderr":         result.Stderr,
		"compile_output": result.CompileOutput,
		"status":         result.StatusDesc,
		"status_id":      result.StatusID,
		"time":           result.Time,
		"memory":         result.Memory,
	})
}
