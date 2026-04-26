package execute

import (
	"apex/internal/judge0"
	"net/http"

	"github.com/gin-gonic/gin"
)

type executeRequest struct {
	Language string `json:"language" binding:"required"`
	Code     string `json:"code" binding:"required"`
	Stdin    string `json:"stdin"`
}

func Execute(c *gin.Context) {
	var req executeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "language and code are required"})
		return
	}

	if _, ok := judge0.LanguageMap[req.Language]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported language: " + req.Language})
		return
	}

	result := judge0.RunCode(req.Code, req.Language, req.Stdin)

	if result.StatusID == -1 {
		c.JSON(http.StatusGatewayTimeout, gin.H{"error": result.Stderr})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stdout":    result.Stdout,
		"stderr":    result.Stderr,
		"status_id": result.StatusID,
		"time_ms":   result.TimeMs,
		"memory_kb": result.MemoryKb,
	})
}
