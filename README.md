# CodeJudge

An online exam and auto-grading platform for programming courses. Teachers create classes, build coding exams with test cases, and review results. Students join classes, take timed exams in a LeetCode-style split-pane editor, and get instant automated feedback.

Uses Monaco Editor (VS Code's editor) and [Judge0 CE](https://ce.judge0.com/) for sandboxed code execution. Supported languages: **Python 3**, **JavaScript**, **C**, **C++**.

## Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) 15+

## Quick Start

### Backend

```bash
cd backend
go run main.go
```

Starts on **http://localhost:8080**. Requires a PostgreSQL database (auto-migrates on startup). Configure via environment variables or `backend/config/`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on **http://localhost:5173**. Proxies API requests to the backend at `localhost:8080`.

## Features

- **Auth**: JWT-based signup/login with role-based access (teacher/student)
- **Classes**: Teachers create classes with auto-generated invite codes, students join via code
- **Exams**: Full exam lifecycle — create, schedule (start/end time), assign to classes, set duration
- **Problem Editor**: Per-problem difficulty, starter code (per language), hints, time/memory limits, sample + hidden test cases
- **Exam Taking**: Full-screen split-pane UI with Monaco editor, problem tabs, countdown timer, run (sample tests) and submit
- **Auto-Grading**: Async grading via Judge0 — compares stdout against expected output, calculates score
- **Results & Analytics**: Teacher exam results table with CSV export, class stats (avg score, pass rate), student submission history with detailed test result views
- **Code Playground**: Standalone editor at `/editor` for free-form code execution

## Architecture

```
browser  ──REST API──▶  Go backend (Gin + GORM)  ──Judge0 API──▶  Sandboxed execution
                        │
                        └──▶  PostgreSQL
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Monaco Editor, Recharts |
| Backend | Go, Gin, GORM, JWT |
| Database | PostgreSQL |
| Code Execution | Judge0 CE |
| Design | Floating glassmorphic UI with warm dark theme |
