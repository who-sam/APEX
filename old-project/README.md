# Kernel

A full-stack coding exam platform for programming courses. Teachers create classes, build timed exams with auto-graded problems, and review analytics. Students join classes, take exams in a LeetCode-style split-pane editor, and get instant feedback.

Built with Monaco Editor (VS Code's engine) and [Judge0 CE](https://ce.judge0.com/) for sandboxed code execution.

**Supported languages:** Python 3, JavaScript, C, C++

## Prerequisites

- [Go](https://go.dev/dl/) 1.21+
- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) 15+
- [Judge0 CE](https://github.com/judge0/judge0) instance (for code execution)

## Quick Start

### Backend

```bash
cd backend
go run main.go
```

Starts on `http://localhost:8080`. Auto-migrates the database on startup.

**Environment variables:**

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | _(empty)_ | Database password |
| `DB_NAME` | `codejudge` | Database name |
| `JWT_SECRET` | `dev-secret-change-in-prod` | JWT signing secret |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. API requests go to the backend at `localhost:8080`.

## Features

### Authentication
- Email + password signup with role selection (teacher or student)
- JWT-based sessions with 24-hour expiry
- Role-based route protection
- Multi-tab logout sync
- Password change via settings

### Teacher

- **Classes** — Create classes with auto-generated 6-character invite codes. View members, class stats (avg score, pass rate), and delete classes.
- **Exams** — Create, edit, schedule (start/end time + duration), and delete exams. Assign exams to one or more classes.
- **Problems** — Add problems to exams with title, description, difficulty (easy/medium/hard), starter code, hints, and time/memory limits.
- **Test Cases** — Add sample (visible to students) and hidden test cases per problem. Edit, delete, and reorder.
- **Results** — View exam results per student with scores and submission details. Export results as CSV. Score distribution charts.
- **Class Stats** — Member count, exam count, total submissions, average score, pass rate.
- **Overview Dashboard** — Aggregate stats across all classes and exams with recent results.

### Student

- **Classes** — Join classes via invite code. View enrolled classes and share codes.
- **Exams** — View upcoming, active, and completed exams. Start exams from the schedule.
- **Exam Taking** — Full-screen split-pane UI: problem description (left) + Monaco editor (right) + test results (bottom). Problem tabs, countdown timer, language selector. Run against sample tests for instant feedback, or submit for full grading. Auto-submit on timer expiry. Code persists when switching between problems and on re-entry.
- **Code Playground** — Standalone editor for free-form code execution with stdin input support.
- **Results** — View all past submissions with scores, status, and per-test-case details.
- **Dashboard** — Stats cards (exams taken, avg score, pass rate), performance chart (monthly trends), upcoming exams, recent results.
- **Settings** — Profile bio, notification preferences, dark/light theme toggle, password change.
- **Messages** — Inbox with read/unread, star, and delete actions.
- **Teams** — Create teams and add members.

### Code Execution & Grading

| Mode | Description |
|---|---|
| **Execute** (playground) | Free-form code execution with optional stdin. Returns stdout, stderr, compile output, time, and memory. |
| **Run** (exam) | Runs code against sample test cases only. Shows input, expected output, actual output, and pass/fail per case. |
| **Submit** (exam) | Creates a submission, then an async goroutine grades against ALL test cases (sample + hidden). Updates status, score, passed/total counts. Server rejects submissions after exam `end_time`. |

## Architecture

```
Browser ──REST API──▶ Go backend (Gin + GORM) ──Judge0 API──▶ Sandboxed execution
                      │
                      └──▶ PostgreSQL
```

## Project Structure

```
backend/
├── config/           # Environment-based configuration
├── database/         # GORM connection + auto-migration
├── grading/          # Async grading engine (Judge0 integration)
├── handlers/
│   ├── auth.go       # Signup, login
│   ├── analytics.go  # Exam results, class stats, CSV export
│   ├── classes.go    # Class CRUD, join
│   ├── exams.go      # Exam CRUD, assign to classes
│   ├── execute.go    # Code execution (playground)
│   ├── messages.go   # Direct messaging
│   ├── problems.go   # Problem + test case CRUD
│   ├── profile.go    # Profile + password change
│   ├── student.go    # Student exams (with status logic)
│   ├── student_stats.go  # Dashboard stats + performance
│   ├── submissions.go    # Submit, run, get results
│   └── teams.go      # Team management
├── middleware/       # JWT auth + role-based access
├── models/           # GORM models (12 tables)
└── main.go           # Routes + server

frontend/src/
├── components/
│   ├── AppSidebar.tsx       # Floating icon sidebar
│   ├── FloatingNavbar.tsx   # Top navbar with pills
│   ├── DashboardLayout.tsx  # Student layout shell
│   ├── TeacherLayout.tsx    # Teacher layout shell
│   ├── ProtectedRoute.tsx   # Role-based route guard
│   ├── dashboard/           # Student dashboard widgets
│   └── ui/                  # 40+ shadcn/ui components
├── pages/
│   ├── AuthPage.tsx         # Login / signup
│   ├── Dashboard.tsx        # Student home
│   ├── CodeEditor.tsx       # Playground
│   ├── ExamTaking.tsx       # Exam interface
│   ├── MyClasses.tsx        # Student classes
│   ├── UpcomingExams.tsx    # Exam schedule
│   ├── Results.tsx          # Submission history
│   ├── Practice.tsx         # Browse exams
│   ├── Settings.tsx         # Profile & preferences
│   ├── Messages.tsx         # Inbox
│   ├── Team.tsx             # Team management
│   └── teacher/
│       ├── OverviewPage.tsx      # Teacher dashboard
│       ├── ClassesPage.tsx       # Class management
│       ├── ClassDetailPage.tsx   # Class members & stats
│       ├── ExamsPage.tsx         # Exam management
│       ├── ExamBuilderPage.tsx   # Exam editor + class assign
│       ├── ProblemEditorPage.tsx  # Problem + test case editor
│       └── ExamResultsPage.tsx   # Results & analytics
├── hooks/useAuth.tsx  # Auth context + multi-tab sync
├── lib/api.ts         # API client (all endpoints)
└── App.tsx            # Router setup
```

## Database Schema

```
users            → id, email, password_hash, role, name
classes          → id, teacher_id, name, section, invite_code
class_members    → id, class_id, user_id, joined_at
exams            → id, teacher_id, title, description, duration_minutes, start_time, end_time
exam_classes     → id, exam_id, class_id
problems         → id, exam_id, title, description, difficulty, starter_code, hints, time_limit_ms, memory_limit_kb, order_index
test_cases       → id, problem_id, input, expected_output, is_sample, order_index
submissions      → id, user_id, problem_id, exam_id, language, code, status, passed_count, total_count, score, execution_time_ms, memory_kb
test_results     → id, submission_id, test_case_id, passed, actual_output, execution_time_ms, memory_kb, status
user_profiles    → id, user_id, bio, email_notifications, push_notifications, exam_reminders, result_alerts
messages         → id, from_id, to_id, subject, body, type, is_read, is_starred
teams            → id, name, created_by
team_members     → id, team_id, user_id, role
```

## API Endpoints

### Public
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |

### Teacher (requires `teacher` role)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/classes` | Create class |
| GET | `/api/classes` | List teacher's classes |
| GET | `/api/classes/:id` | Class detail with members |
| DELETE | `/api/classes/:id` | Delete class |
| GET | `/api/classes/:id/stats` | Class statistics |
| POST | `/api/exams` | Create exam |
| GET | `/api/exams` | List teacher's exams |
| GET | `/api/exams/:id` | Exam with problems & test cases |
| PUT | `/api/exams/:id` | Update exam |
| DELETE | `/api/exams/:id` | Delete exam |
| POST | `/api/exams/:id/problems` | Add problem to exam |
| POST | `/api/exams/:id/assign` | Assign exam to classes |
| GET | `/api/exams/:id/results` | Exam results by student |
| GET | `/api/exams/:id/results/export` | Export results as CSV |
| GET | `/api/problems/:id` | Get problem with test cases |
| PUT | `/api/problems/:id` | Update problem |
| DELETE | `/api/problems/:id` | Delete problem |
| POST | `/api/problems/:id/test-cases` | Add test case |
| PUT | `/api/test-cases/:id` | Update test case |
| DELETE | `/api/test-cases/:id` | Delete test case |

### Student (requires `student` role)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/student/classes/join` | Join class by invite code |
| GET | `/api/student/classes` | List enrolled classes |
| GET | `/api/student/exams` | List exams (with status) |
| GET | `/api/student/exams/:id` | Exam detail for taking |
| GET | `/api/student/submissions` | Submission history |
| GET | `/api/student/stats` | Dashboard stats |
| GET | `/api/student/performance` | Monthly performance data |

### Shared (all authenticated users)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/execute` | Execute code (playground) |
| POST | `/api/submissions` | Submit solution |
| POST | `/api/submissions/run` | Run against sample tests |
| GET | `/api/submissions/:id` | Get submission detail |
| GET | `/api/profile` | Get profile |
| PUT | `/api/profile` | Update profile |
| PUT | `/api/profile/password` | Change password |
| GET | `/api/messages` | List messages |
| GET | `/api/messages/:id` | Get message |
| POST | `/api/messages` | Send message |
| PUT | `/api/messages/:id/read` | Mark as read |
| PUT | `/api/messages/:id/star` | Toggle star |
| DELETE | `/api/messages/:id` | Delete message |
| GET | `/api/teams` | List teams |
| GET | `/api/teams/:id` | Get team |
| POST | `/api/teams` | Create team |
| POST | `/api/teams/:id/members` | Add team member |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Monaco Editor, Recharts, React Query |
| Backend | Go, Gin, GORM, JWT (golang-jwt), bcrypt |
| Database | PostgreSQL |
| Code Execution | Judge0 CE |
| Design | Floating glassmorphic UI, warm dark theme, Lucide icons |
