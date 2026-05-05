# APEX

> Exam, grading, and live-coding portal for classrooms. Go + Gin backend, React + Vite frontend, PostgreSQL store, Judge0 sandbox for code execution.

APEX lets teachers build mixed-format exams (coding, MCQ, written), assign them to classes, auto-grade code against test cases, and manually grade written answers. Students join classes by invite code, take timed exams in a Monaco editor, see live test feedback, and review results.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Project Layout](#project-layout)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Auth & Roles](#auth--roles)
- [Code Execution & Grading](#code-execution--grading)
- [Background Jobs](#background-jobs)
- [Database Migrations](#database-migrations)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Features

**Teacher**
- Class management with invite codes, cover images, member roster, removal.
- Exam builder: coding / MCQ / written, per-question points, difficulty, hints, time/memory limits, image attachments, tags.
- Question bank with folders for reuse across exams.
- Draft vs published exams; shuffle questions; show-results-after toggle; per-exam passing score.
- Assign exams to one or many classes.
- Auto-grading via Judge0 with normalized output diffing; manual grading queue for written answers (with teacher feedback + score override).
- Announcements per class with attachments; notification fan-out to enrolled students.
- Dashboard, results explorer, pending-grading queue, class stats.
- Grade announcement gating: optionally block announcement until all manual grading is complete.
- Exam preview: view any exam exactly as students see it before publishing.

**Student**
- Join classes via 8-char invite code; leave class; see assigned exams.
- Timed exam attempts with autosave, resume, and shuffled question order.
- Monaco editor with multi-language run / submit, sample-test feedback.
- Results review per attempt with per-test breakdown and teacher feedback.
- Profile, notifications, help page.

**Platform**
- JWT auth, password reset by email, Google Identity Services sign-in.
- Email + in-app reminders for upcoming exams (1h before, at start) and graded notifications.
- Idempotent SQL migrations gated in front of GORM AutoMigrate (see [ORM_RULES.md](ORM_RULES.md)).

---

## Architecture

```
┌───────────────────┐    HTTPS/JSON     ┌──────────────────────┐
│  React + Vite SPA │ ────────────────▶ │  Gin REST API (Go)   │
│  (Monaco editor)  │ ◀──────────────── │  /api/* routes       │
└───────────────────┘                   └──────────┬───────────┘
                                                   │
                          ┌────────────────────────┼─────────────────────────┐
                          │                        │                         │
                          ▼                        ▼                         ▼
                  ┌─────────────┐          ┌──────────────┐         ┌────────────────┐
                  │ PostgreSQL  │          │  Judge0 CE   │         │ SMTP (optional)│
                  │  (GORM)     │          │  sandbox     │         │ password reset │
                  └─────────────┘          └──────────────┘         │ exam reminders │
                                                                    └────────────────┘
```

Backend is a single Gin process. Routes are split into `public` (no auth) and `protected` (JWT middleware). Role-scoped subgroups (`teacher`, `student`) are enforced by `middleware.RequireRole`. A background scheduler (`internal/reminder`) ticks for exam reminders.

---

## Tech Stack

| Layer       | Choice                                                            |
|-------------|-------------------------------------------------------------------|
| Language    | Go 1.25.3                                                         |
| HTTP        | `gin-gonic/gin` 1.12, `gin-contrib/cors`                          |
| ORM         | `gorm.io/gorm` 1.31 + `gorm.io/driver/postgres`                   |
| Auth        | `golang-jwt/jwt/v5`, Google Identity Services (`google.golang.org/api`) |
| DB          | PostgreSQL 16 (Docker)                                            |
| Sandbox     | Judge0 CE (default `https://ce.judge0.com`)                       |
| Frontend    | React 18, Vite 5, TypeScript 5                                    |
| UI          | Tailwind 3, shadcn/ui (Radix), lucide-react                       |
| Editor      | `@monaco-editor/react`                                            |
| Data        | `@tanstack/react-query` 5, `react-hook-form`, `zod`               |
| Routing     | `react-router-dom` 6                                              |
| Tests       | Vitest + Testing Library (frontend); Go `testing` (backend)       |

---

## Quick Start

### Prerequisites
- Go 1.25+
- Node 18+ (or Bun) — frontend uses `bun.lock` but `npm` works too
- Docker (for the bundled Postgres) **or** an existing Postgres 16
- Optional: a reachable Judge0 instance (default uses public `ce.judge0.com`)

### One-shot dev
```bash
./start.sh
```
This will:
1. Copy `.env.example` → `.env` if missing.
2. `docker compose up -d` Postgres on `:5432`.
3. `go run main.go` on `:8080`.
4. `npm run dev` (Vite) on `:5173`.
5. Trap Ctrl+C and tear everything down.

Open http://localhost:5173 and sign up.

### Manual
```bash
# 1. Postgres
docker compose up -d

# 2. Backend
cp .env.example .env
go mod download
go run main.go            # listens on :8080

# 3. Frontend
cd frontend
npm install               # or: bun install
npm run dev               # http://localhost:5173
```

---

## Configuration

All config is loaded from environment (`.env` is auto-loaded via `godotenv`). Defaults shown.

| Variable            | Default                       | Purpose                                        |
|---------------------|-------------------------------|------------------------------------------------|
| `DB_HOST`           | `localhost`                   | Postgres host                                  |
| `DB_PORT`           | `5432`                        | Postgres port                                  |
| `DB_USER`           | `postgres`                    | Postgres user                                  |
| `DB_PASSWORD`       | `postgres`                    | Postgres password                              |
| `DB_NAME`           | `apex`                        | Database name                                  |
| `JWT_SECRET`        | `dev-secret-change-in-prod`   | HS256 signing key — **rotate in prod**         |
| `JUDGE0_URL`        | `https://ce.judge0.com`       | Judge0 base URL                                |
| `APP_URL`           | `http://localhost:5173`       | Public frontend URL (used in email links)      |
| `SMTP_HOST`         | *(empty)*                     | If empty, password-reset link is logged only   |
| `SMTP_PORT`         | `587`                         |                                                |
| `SMTP_USER`         | *(empty)*                     |                                                |
| `SMTP_PASS`         | *(empty)*                     |                                                |
| `SMTP_FROM`         | *(empty)*                     | Envelope-from address                          |
| `GOOGLE_CLIENT_ID`  | *(empty)*                     | Google Identity Services web client ID         |

> Backend listens on `:8080` (hardcoded in `main.go`). Frontend dev server on `:5173` (Vite default). Adjust CORS in `internal/middleware/cors.go` if you change ports.

---

## Project Layout

```
.
├── main.go                       # Gin bootstrap; mounts every package's routes
├── docker-compose.yml            # Postgres 16 only
├── start.sh                      # one-shot dev launcher
├── ORM_RULES.md                  # required reading before schema changes
├── go.mod / go.sum
├── internal/
│   ├── config/                   # env loading, DSN
│   ├── database/                 # GORM init + idempotent SQL migrations
│   ├── middleware/               # CORS, JWT auth, role gating
│   ├── models/                   # GORM models (single source of truth for schema)
│   ├── auth/                     # signup, login, Google OAuth, password reset, account delete
│   ├── class/                    # CRUD, member removal, stats
│   ├── student/                  # student-scoped views (join, classes, exams, stats, performance)
│   ├── teacher/                  # teacher dashboard, pending-grading queue
│   ├── exam/                     # exam CRUD, assign, close/reopen, attempts (start/submit), results
│   ├── problem/                  # exam problems + question bank
│   ├── testcase/                 # test cases per problem
│   ├── submission/               # submit/run/grade/get
│   ├── execute/                  # one-off code run (playground)
│   ├── judge0/                   # client + grader (output normalization)
│   ├── folder/                   # bank-question folders
│   ├── announcement/             # per-class announcements + attachments
│   ├── notification/             # in-app notifications + helper for fan-out
│   ├── profile/                  # profile + change-password
│   ├── email/                    # SMTP wrapper (no-op when SMTP_HOST empty)
│   └── reminder/                 # background ticker for exam reminders
└── frontend/
    ├── index.html
    ├── vite.config.ts / vitest.config.ts
    ├── src/
    │   ├── main.tsx / App.tsx
    │   ├── app/routes.tsx        # central route table
    │   ├── contexts/             # AuthContext, role gating
    │   ├── components/           # shared UI (shadcn/ui + layout)
    │   ├── features/             # feature folders: auth, dashboard, exams, courses,
    │   │                         #   grading, playground, results, settings, social
    │   │                         # key routes: exam-builder, question-bank, grading,
    │   │                         #   exam/:id (take), exam/:id/review, exam-preview/:id,
    │   │                         #   help, notifications
    │   ├── pages/                # Index, NotFound
    │   ├── hooks/ lib/ assets/
    │   └── test/                 # Vitest setup + suites
    └── package.json
```

---

## Data Model

Core entities (see `internal/models/*.go` for full struct tags):

- **User** — `email`, `password_hash`, `role` (`teacher` | `student`), `name`, optional `google_id`. `UserProfile` carries bio, avatar (base64 dataURL or URL), notification toggles, and per-teacher defaults.
- **Class** — owned by a teacher, joined by students via 8-char `invite_code`. Fields: `cover_image`, `grades_announced`, `passing_threshold`, `block_announce_with_pending`. Membership via `ClassMember`.
- **Exam** — owned by teacher; `duration_minutes`, optional `start_time`/`end_time`, `is_draft`, `is_practice`, `shuffle_questions`, `show_results_after`, `passing_score`. Assigned to one or many classes via `ExamClass`. Has many `Problem`. `reset_at` invalidates cached student attempts when an exam is destructively edited.
- **Problem** — three types: `coding`, `mcq`, `written`. Belongs to an exam **or** to the question bank (`is_bank=true`). Optional `class_id` and `folder_id` for bank organization. Coding problems have `TestCase` rows. MCQ uses `options` + `correct_option_ids` (JSONB). Written has `rubric`, `max_word_count`, `require_manual_grading`.
- **TestCase** — `input`, `expected_output`, `is_sample`, `points`.
- **ExamAttempt** — one row per (student, exam) attempt; aggregates `score` across submissions (excluding `pending_review`); tracks `graded_notified` for one-shot notification.
- **Submission** — one row per (attempt, problem). Status lifecycle: `pending` → `running` → (`passed` | `failed` | `pending_review`). Carries `score`, `passed_count`/`total_count`, `code`/`selected_options`/`text_answer`, optional `teacher_feedback`. `TestResult` rows hold per-test outcome.
- **Folder** — per-teacher grouping for bank questions.
- **Announcement** — per-class, with JSONB `attachments`. Fans out `Notification` rows to enrolled students.
- **Notification**, **PasswordResetToken** — straightforward.

> Schema changes **must** follow [ORM_RULES.md](ORM_RULES.md) — never use `gorm:"default:X"` on existing tables. Add the column nullable, backfill, then constrain. All such migrations live in `internal/database/migrations.go`.

---

## API Reference

Base URL: `http://localhost:8080/api`. All protected routes require `Authorization: Bearer <jwt>`. Tokens are issued on signup/login.

### Auth (`public`)
| Method | Path                       | Body                                         |
|--------|----------------------------|----------------------------------------------|
| POST   | `/auth/signup`             | `{name, email, password, role}`              |
| POST   | `/auth/login`              | `{email, password}`                          |
| POST   | `/auth/forgot-password`    | `{email}`                                    |
| POST   | `/auth/reset-password`     | `{token, password}`                          |
| POST   | `/auth/google`             | `{credential, role?}` — Google ID token      |
| DELETE | `/auth/account`            | *(protected)* permanently delete account     |

### Profile
| Method | Path                  |
|--------|-----------------------|
| GET    | `/profile`            |
| PUT    | `/profile`            |
| PUT    | `/profile/password`   |

### Classes (teacher)
| Method | Path                                       |
|--------|--------------------------------------------|
| POST   | `/classes`                                 |
| GET    | `/classes`                                 |
| GET    | `/classes/:id`                             |
| PUT    | `/classes/:id`                             |
| DELETE | `/classes/:id`                             |
| GET    | `/classes/:id/stats`                       |
| DELETE | `/classes/:id/members/:userId`             |

### Student
| Method | Path                              |
|--------|-----------------------------------|
| POST   | `/student/classes/join`           |
| DELETE | `/student/classes/:id`            |
| GET    | `/student/classes`                |
| GET    | `/student/classes/:id`            |
| GET    | `/student/exams`                  |
| GET    | `/student/exams/:id`              |
| GET    | `/student/submissions`            |
| GET    | `/student/stats`                  |
| GET    | `/student/performance`            |
| POST   | `/student/exams/:id/start`        |
| POST   | `/student/exams/:id/submit`       |
| GET    | `/attempts/mine`                  |

### Teacher
| Method | Path                          |
|--------|-------------------------------|
| GET    | `/teacher/dashboard`          |
| GET    | `/teacher/grading/pending`    |

### Exams (teacher)
| Method | Path                          |
|--------|-------------------------------|
| POST   | `/exams`                      |
| GET    | `/exams`                      |
| GET    | `/exams/:id`                  |
| PUT    | `/exams/:id`                  |
| DELETE | `/exams/:id`                  |
| POST   | `/exams/:id/assign`           |
| POST   | `/exams/:id/close`            |
| POST   | `/exams/:id/reopen`           |
| GET    | `/exams/:id/results`          |

### Problems (teacher)
| Method | Path                              |
|--------|-----------------------------------|
| POST   | `/exams/:id/problems`             |
| GET    | `/problems`                       |
| POST   | `/problems/bank`                  |
| GET    | `/problems/:id`                   |
| PUT    | `/problems/:id`                   |
| DELETE | `/problems/:id`                   |
| POST   | `/problems/:id/test-cases`        |
| PUT    | `/test-cases/:id`                 |
| DELETE | `/test-cases/:id`                 |

### Folders (teacher)
| Method | Path                |
|--------|---------------------|
| GET    | `/folders`          |
| POST   | `/folders`          |
| PUT    | `/folders/:id`      |
| DELETE | `/folders/:id`      |

### Submissions
| Method | Path                              |
|--------|-----------------------------------|
| POST   | `/submissions`                    |
| POST   | `/submissions/run`                |
| GET    | `/submissions/:id`                |
| PUT    | `/submissions/:id/grade`          |
| POST   | `/execute`                        |

### Announcements
| Method | Path                                       |
|--------|--------------------------------------------|
| GET    | `/classes/:id/announcements`               |
| POST   | `/classes/:id/announcements`               |
| PUT    | `/announcements/:id`                       |
| DELETE | `/announcements/:id`                       |

### Notifications
| Method | Path                                  |
|--------|---------------------------------------|
| GET    | `/notifications`                      |
| GET    | `/notifications/unread-count`         |
| PUT    | `/notifications/:id/read`             |
| PUT    | `/notifications/read-all`             |

---

## Auth & Roles

- Passwords hashed with bcrypt; tokens are HS256 JWT signed with `JWT_SECRET`.
- `middleware.Auth` extracts `Authorization: Bearer <token>`, sets `user_id` and `role` on the Gin context.
- `middleware.RequireRole("teacher" | "student")` gates feature subgroups.
- Google sign-in: frontend posts the Identity Services credential to `/auth/google`. Backend verifies via Google's public certs, links by `google_id`, and issues a JWT. New users without a role parameter default to `student`.
- Password reset: `/auth/forgot-password` issues a `PasswordResetToken`. If `SMTP_HOST` is empty the link is **logged to stdout** for dev; otherwise emailed.

---

## Code Execution & Grading

- `POST /execute` and `POST /submissions/run` send code to Judge0 and stream back stdout/stderr/time/memory for the playground and "run sample tests" flows.
- `POST /submissions` is graded by `internal/judge0/grader.go`:
  - Each `TestCase` is sent to Judge0 with `input`. Output is normalized (trailing whitespace, newline endings, optional trailing newline) before equality check.
  - `score = passed_count / total_count * 100` for coding; MCQ scored against `correct_option_ids` (set equality, with `multiple_correct` rule); written submissions go to `pending_review`.
  - Aggregated `ExamAttempt.score` excludes `pending_review` rows so an in-flight written grade doesn't depress the visible total.
- Manual grading: teachers grade written answers from `/teacher/grading/pending`; `PUT /submissions/:id/grade` accepts `{score, teacher_feedback}` and re-aggregates the parent attempt.
- Language aliases for Judge0 (e.g. `python` → Python 3) live in `internal/judge0/client.go`.

---

## Background Jobs

`internal/reminder/scheduler.go` runs as a goroutine started by `reminder.Start()` in `main.go`. It periodically scans `exams` for:
- Upcoming exams within 1h → in-app notification (`reminder_sent_at` dedup) and optional email (`email_reminder1h_sent_at`).
- Exam start moment → email when `notify_exam_email` profile flag is on (`email_reminder_start_sent_at`).
- Newly graded attempts → notification, gated by `graded_notified` boolean on `ExamAttempt`.

All deduplication is column-based, so restarting the process cannot re-send.

---

## Database Migrations

Schema changes go through two passes in `internal/database/database.go`:

1. **`RunMigrations`** — explicit, idempotent SQL executed **before** `AutoMigrate`. Use this for any change to an existing table (add column, backfill, set NOT NULL, set DEFAULT, drop FK, sweep orphans).
2. **`AutoMigrate`** — for new tables only.
3. **`RunPostMigrations`** — runs after AutoMigrate so it can reference GORM-created tables (e.g. adds `fk_problems_folder` after `folders` exists).

> See [ORM_RULES.md](ORM_RULES.md) for the incident that motivated this and the full set of rules. **Never** add `gorm:"default:X"` to a struct field on an already-populated table without a matching SQL migration.

---

## Development

```bash
# Backend
go run main.go                     # dev
go build -o apex ./...             # binary
go vet ./...                       # static checks

# Frontend (in frontend/)
npm run dev                        # Vite dev server
npm run build                      # production bundle → dist/
npm run lint                       # ESLint
npm run preview                    # serve built bundle
```

The frontend talks to the backend via the Vite dev proxy / CORS. Adjust `vite.config.ts` if you change the API origin.

---

## Testing

```bash
# Backend
go test ./...

# Frontend
cd frontend
npm run test                       # Vitest, single run
npm run test:watch                 # watch mode
```

Frontend tests use jsdom + Testing Library (`frontend/src/test/`).

---

## Deployment

There is no production Dockerfile checked in — only `docker-compose.yml` for the dev Postgres. Minimal production checklist:

- Build the backend: `CGO_ENABLED=0 go build -o apex .` and ship the static binary.
- Build the frontend: `cd frontend && npm ci && npm run build`. Serve `frontend/dist/` from a CDN or behind the same reverse proxy.
- Provide a managed Postgres 16 and set `DB_*`.
- **Rotate `JWT_SECRET`** to a long random value.
- Run a Judge0 instance you control — the public `ce.judge0.com` is rate-limited and not for production.
- Configure `SMTP_*` and `APP_URL` so password-reset and exam-reminder emails resolve correctly.
- Set `GOOGLE_CLIENT_ID` if Google sign-in is enabled; whitelist `APP_URL` in the Google Cloud Console.
- Front the API with HTTPS; tighten `internal/middleware/cors.go` allowed origins.

---

## Troubleshooting

| Symptom                                                    | Likely cause / fix                                                                                  |
|------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| Backend exits with `Failed to connect to database`         | Postgres not up; check `docker compose ps` and `DB_*` env.                                          |
| `unsupported language` from Judge0                         | Add the language alias in `internal/judge0/client.go`.                                              |
| Every exam disappears from student view after a migration  | You added `gorm:"default:true"` on an existing table. Read [ORM_RULES.md](ORM_RULES.md) and revert. |
| Password-reset emails never arrive                         | `SMTP_HOST` empty → link is in backend stdout. Set SMTP creds for real delivery.                    |
| Google sign-in returns 401                                 | `GOOGLE_CLIENT_ID` missing or not matching the Identity Services client used by the frontend.       |
| Attempt score < 100 even though all coding tests passed    | A `pending_review` written submission was included in an old aggregate. Re-run aggregate migration. |

---

## License

No license file is included. Treat the repository as **all rights reserved** until one is added.
