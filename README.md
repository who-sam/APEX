# CodeJudge - Online Code Execution MVP

A minimal web app for writing and executing code in the browser.
Uses Monaco Editor (VS Code's editor) and the free [Judge0 CE API](https://ce.judge0.com/) for code execution. No API key required.

Supported languages: **Python 3**, **JavaScript**, **C**, **C++**.

## Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [Node.js](https://nodejs.org/) 18+

## Backend

```bash
cd backend
go run main.go
```

Starts on **http://localhost:8080**. Exposes a single endpoint:

```
POST /api/execute
Body: { "language": "python3", "code": "print('hi')" }
```

The backend maps frontend language keys to Judge0 language IDs (`python3` -> 100, `javascript` -> 102, etc.) and submits code to `https://ce.judge0.com/submissions?wait=true`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on **http://localhost:5173**. The frontend calls the backend directly at `localhost:8080` (CORS is configured).

## Architecture

```
browser  ──POST /api/execute──▶  Go backend (Gin)  ──POST──▶  Judge0 CE API
         ◀── execution result ──                    ◀── result ──
```
