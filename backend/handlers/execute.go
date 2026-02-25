package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

const judge0URL = "https://ce.judge0.com/submissions?wait=true&base64_encoded=false&fields=stdout,stderr,compile_output,status,time,memory"

var languageMap = map[string]int{
	"python3":    100,
	"javascript": 102,
	"c":          103,
	"cpp":        105,
}

type executeRequest struct {
	Language string `json:"language" binding:"required"`
	Code     string `json:"code" binding:"required"`
}

type judge0Request struct {
	LanguageID int    `json:"language_id"`
	SourceCode string `json:"source_code"`
	Stdin      string `json:"stdin"`
}

type judge0Response struct {
	Stdout        *string      `json:"stdout"`
	Stderr        *string      `json:"stderr"`
	CompileOutput *string      `json:"compile_output"`
	Status        judge0Status `json:"status"`
	Time          *string      `json:"time"`
	Memory        *json.Number `json:"memory"`
}

type judge0Status struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

func Execute(c *gin.Context) {
	var req executeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "language and code are required"})
		return
	}

	langID, ok := languageMap[req.Language]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported language: " + req.Language})
		return
	}

	j0Req := judge0Request{
		LanguageID: langID,
		SourceCode: req.Code,
		Stdin:      "",
	}

	body, err := json.Marshal(j0Req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to build request"})
		return
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(judge0URL, "application/json", bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusGatewayTimeout, gin.H{"error": "execution timed out or Judge0 is unreachable"})
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read Judge0 response"})
		return
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		c.JSON(resp.StatusCode, gin.H{"error": "Judge0 error: " + string(respBody)})
		return
	}

	var j0Resp judge0Response
	if err := json.Unmarshal(respBody, &j0Resp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse Judge0 response"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stdout":         deref(j0Resp.Stdout),
		"stderr":         deref(j0Resp.Stderr),
		"compile_output": deref(j0Resp.CompileOutput),
		"status":         j0Resp.Status.Description,
		"status_id":      j0Resp.Status.ID,
		"time":           deref(j0Resp.Time),
		"memory":         j0Resp.Memory,
	})
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
