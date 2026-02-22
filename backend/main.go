package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Judge0 CE public instance — no API key required.
const judge0URL = "https://ce.judge0.com/submissions?wait=true&base64_encoded=false&fields=stdout,stderr,compile_output,status,time,memory"

// Maps frontend language keys to Judge0 language IDs.
// Using latest available compiler/runtime versions.
var languageMap = map[string]int{
	"python3":    100, // Python (3.12.5)
	"javascript": 102, // JavaScript — Node.js (22.08.0)
	"c":          103, // C (GCC 14.1.0)
	"cpp":        105, // C++ (GCC 14.1.0)
}

// ExecuteRequest is the JSON body the frontend sends.
type ExecuteRequest struct {
	Language string `json:"language" binding:"required"`
	Code     string `json:"code" binding:"required"`
}

// Judge0Request is what we send to the Judge0 API.
type Judge0Request struct {
	LanguageID int    `json:"language_id"`
	SourceCode string `json:"source_code"`
	Stdin      string `json:"stdin"`
}

// Judge0Response is what Judge0 returns (the fields we requested).
type Judge0Response struct {
	Stdout        *string       `json:"stdout"`
	Stderr        *string       `json:"stderr"`
	CompileOutput *string       `json:"compile_output"`
	Status        Judge0Status  `json:"status"`
	Time          *string       `json:"time"`
	Memory        *json.Number  `json:"memory"`
}

type Judge0Status struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

func main() {
	r := gin.Default()

	// Allow the Vite dev server origin.
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"POST"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	r.POST("/api/execute", handleExecute)

	r.Run(":8080")
}

func handleExecute(c *gin.Context) {
	var req ExecuteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "language and code are required"})
		return
	}

	langID, ok := languageMap[req.Language]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported language: " + req.Language})
		return
	}

	// Build Judge0 payload.
	j0Req := Judge0Request{
		LanguageID: langID,
		SourceCode: req.Code,
		Stdin:      "",
	}

	body, err := json.Marshal(j0Req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to build request"})
		return
	}

	// 30s timeout — Judge0 default execution limit is ~5s but network can be slow.
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

	// If Judge0 returned a non-200/201, forward the error.
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		c.JSON(resp.StatusCode, gin.H{"error": "Judge0 error: " + string(respBody)})
		return
	}

	// Parse Judge0 response and normalize for the frontend.
	var j0Resp Judge0Response
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

// deref safely dereferences a *string, returning "" if nil.
func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
