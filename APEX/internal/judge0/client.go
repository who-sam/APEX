package judge0

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

var BaseURL = "https://ce.judge0.com"

var LanguageMap = map[string]int{
	"python3":    100,
	"javascript": 102,
	"c":          103,
	"cpp":        105,
}

type request struct {
	LanguageID int    `json:"language_id"`
	SourceCode string `json:"source_code"`
	Stdin      string `json:"stdin"`
}

type response struct {
	Stdout        *string      `json:"stdout"`
	Stderr        *string      `json:"stderr"`
	CompileOutput *string      `json:"compile_output"`
	Status        statusField  `json:"status"`
	Time          *string      `json:"time"`
	Memory        *json.Number `json:"memory"`
}

type statusField struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

type CodeResult struct {
	Stdout   string
	Stderr   string
	StatusID int
	TimeMs   int
	MemoryKb int
}

func RunCode(code, language, stdin string) CodeResult {
	langID, ok := LanguageMap[language]
	if !ok {
		return CodeResult{StatusID: -1, Stderr: "unsupported language"}
	}

	reqBody := request{
		LanguageID: langID,
		SourceCode: code,
		Stdin:      stdin,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return CodeResult{StatusID: -1, Stderr: "failed to marshal request"}
	}

	url := BaseURL + "/submissions?wait=true&base64_encoded=false&fields=stdout,stderr,compile_output,status,time,memory"
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return CodeResult{StatusID: -1, Stderr: "judge0 unreachable"}
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return CodeResult{StatusID: -1, Stderr: "failed to read response"}
	}

	var j0Resp response
	if err := json.Unmarshal(respBody, &j0Resp); err != nil {
		return CodeResult{StatusID: -1, Stderr: "failed to parse response"}
	}

	result := CodeResult{
		Stdout:   deref(j0Resp.Stdout),
		Stderr:   deref(j0Resp.Stderr),
		StatusID: j0Resp.Status.ID,
	}

	// FIX: parse execution_time_ms from Judge0 time string (seconds → ms)
	if j0Resp.Time != nil {
		if seconds, err := strconv.ParseFloat(strings.TrimSpace(*j0Resp.Time), 64); err == nil {
			result.TimeMs = int(seconds * 1000)
		}
	}

	// FIX: parse memory_kb from Judge0 memory number
	if j0Resp.Memory != nil {
		if mem, err := j0Resp.Memory.Int64(); err == nil {
			result.MemoryKb = int(mem)
		}
	}

	return result
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
