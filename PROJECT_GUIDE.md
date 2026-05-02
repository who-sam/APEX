# APEX — Project Guide (Plain English)

This is a friendly walkthrough of the APEX codebase. It explains **what the
project is, why each piece exists, and how it all fits together**, in language
that doesn't assume you wrote every line yourself. If you can read this front
to back, you can confidently answer questions about the project.

For the dense technical reference (env vars, every API route, migration
rules), see `README.md` and `ORM_RULES.md`. This guide is the "story" version.

---

## Table of Contents

1. [What APEX Is, in One Paragraph](#1-what-apex-is-in-one-paragraph)
2. [Who Uses It and What They Do](#2-who-uses-it-and-what-they-do)
3. [The Big Picture (Architecture)](#3-the-big-picture-architecture)
4. [Why We Picked Each Piece of Tech](#4-why-we-picked-each-piece-of-tech)
5. [The Folder Map](#5-the-folder-map)
6. [How a Request Travels Through the System](#6-how-a-request-travels-through-the-system)
7. [The Database, Explained Like a Spreadsheet](#7-the-database-explained-like-a-spreadsheet)
8. [Key User Flows, Step by Step](#8-key-user-flows-step-by-step)
9. [Code Execution: How Judge0 Grades Code](#9-code-execution-how-judge0-grades-code)
10. [Auth: Signing In and Staying Signed In](#10-auth-signing-in-and-staying-signed-in)
11. [Background Jobs (Reminders)](#11-background-jobs-reminders)
12. [The Migration Rule You Must Not Break](#12-the-migration-rule-you-must-not-break)
13. [The Frontend in 5 Minutes](#13-the-frontend-in-5-minutes)
14. [Common Questions a Reviewer Might Ask](#14-common-questions-a-reviewer-might-ask)
15. [Glossary](#15-glossary)

---

## 1. What APEX Is, in One Paragraph

APEX is a **classroom exam platform**. A teacher creates a class, students
join with an invite code, and the teacher posts exams that can mix three
question types: **coding** (write code, we run it against test cases),
**multiple-choice**, and **written** (free text, the teacher grades it
manually). Students take the exam in a timed session inside a real code
editor (Monaco — the same editor VS Code uses), and they see their results
when the teacher releases them. Think of it as a hybrid of Google Classroom,
HackerRank, and a quiz tool, written from scratch in Go and React.

---

## 2. Who Uses It and What They Do

There are exactly two roles in the system: **teacher** and **student**.

**A teacher can:**
- Create a class. Each class gets an 8-character invite code.
- Build exams from a question bank or from scratch.
- Set duration, start/end times, passing score, whether to shuffle questions,
  whether students see results after submitting.
- Assign one exam to one or more classes.
- Open and close exams.
- Auto-grade coding and MCQ questions; manually grade written answers from
  a "pending grading" queue.
- Post announcements with attachments.
- See a dashboard, results explorer, class stats, and leaderboards.

**A student can:**
- Join a class with an invite code, leave a class.
- See assigned exams and a countdown.
- Take a timed exam. Their progress autosaves so a refresh doesn't kill them.
- Run their code against sample tests before submitting (just like a real
  competitive programming judge).
- See their results, including which test cases passed/failed and any
  feedback the teacher left.
- Use a practice mode (non-graded), check leaderboards, send messages, etc.

---

## 3. The Big Picture (Architecture)

There are four moving parts. That's it.

```
   Browser (React app, Monaco editor)
            │  HTTPS, JSON
            ▼
     Go backend (Gin web framework)
            │
   ┌────────┼────────────┬──────────────────┐
   ▼        ▼            ▼                  ▼
 PostgreSQL   Judge0       SMTP server     Google Identity
 (data store)(code sandbox) (optional, for  (optional, for
                            reset/reminder  "Sign in with
                            emails)         Google")
```

- **Frontend** is a single-page React app. It runs in the user's browser and
  talks to the backend over plain HTTP/JSON.
- **Backend** is one Go process. It handles every API request, talks to the
  database, and calls out to Judge0 when it needs to run code.
- **PostgreSQL** stores everything: users, classes, exams, submissions,
  notifications, etc.
- **Judge0** is a separate service whose only job is "run this code with this
  input, tell me the output." We don't run student code on our own server —
  that would be a security disaster. Judge0 sandboxes it.
- **SMTP and Google** are optional. If they're not configured, the app still
  works; password-reset links just get logged to the terminal instead of
  emailed, and Google sign-in is hidden.

---

## 4. Why We Picked Each Piece of Tech

You may get asked "why this and not that?" Here are the honest answers.

| Choice | Why |
|---|---|
| **Go** for the backend | Fast, single static binary, great concurrency for the background reminder ticker, and the type system catches a lot of bugs at compile time. |
| **Gin** | Lightweight HTTP framework — like Express for Go. Routing, middleware, and JSON binding without ceremony. |
| **GORM** | Go's most popular ORM. Lets us define database tables as Go structs and avoids hand-writing most SQL. |
| **PostgreSQL** | Mature, free, supports JSONB (used for things like MCQ options and announcement attachments), and has solid full-text and indexing. |
| **Judge0** | Already-built, open-source code execution sandbox. Building our own would mean writing a secure container runtime — out of scope. |
| **React + Vite** | React is the standard for SPAs; Vite gives near-instant hot reload during development. |
| **TypeScript** | Catches typos and shape mismatches between frontend and API. |
| **Tailwind + shadcn/ui** | Tailwind for styling speed; shadcn gives us pre-built accessible components (dialogs, dropdowns) we can copy into our codebase and customize. |
| **Monaco editor** | It's literally the editor inside VS Code. Students get syntax highlighting and IntelliSense for free. |
| **TanStack Query** | Caches server state on the frontend so we don't re-fetch on every navigation, and handles loading/error states declaratively. |
| **JWT for auth** | Stateless — the server doesn't need to store sessions. The token itself contains the user ID and role, signed so it can't be forged. |

---

## 5. The Folder Map

Top-level layout:

```
APEX/
├── main.go                # Entry point. Wires everything up.
├── docker-compose.yml     # Spins up Postgres in Docker for dev.
├── start.sh               # One-command dev launcher.
├── README.md              # Technical reference.
├── ORM_RULES.md           # Migration safety rules (read before changing schema).
├── BUG_FIX_PLAN.md        # Notes from a past incident.
├── internal/              # All Go backend code.
└── frontend/              # All React/TypeScript code.
```

### Inside `internal/` (the backend)

The backend is split into small packages, each owning one concept. Every
package follows the same shape: a `routes.go` that registers HTTP endpoints,
plus handler files for the actual logic.

| Package | What it owns |
|---|---|
| `config` | Reads environment variables into a Config struct. |
| `database` | Opens the Postgres connection, runs migrations. |
| `middleware` | CORS headers, JWT auth, role checks (teacher vs student). |
| `models` | The GORM struct definitions. **One source of truth for the schema.** |
| `auth` | Signup, login, password reset, Google OAuth, account delete. |
| `class` | CRUD for classes, member roster, stats. |
| `student` | Student-only views (my classes, my exams, join a class). |
| `teacher` | Teacher-only views (dashboard, pending grading queue). |
| `exam` | Exam CRUD, assigning exams to classes, attempt lifecycle. |
| `problem` | Questions inside exams + the reusable question bank. |
| `testcase` | Test cases attached to coding problems. |
| `submission` | A student's answer to one problem. Run/grade/get. |
| `execute` | One-off "run this code" for the playground. |
| `judge0` | Wrapper around the Judge0 API + the grader logic. |
| `folder` | Folders for organizing bank questions. |
| `announcement` | Per-class announcements with attachments. |
| `notification` | In-app notification feed. |
| `leaderboard` | Class and global rankings. |
| `profile` | User profile + change password. |
| `message` | Direct messages between users. |
| `team` | Teams and team members. |
| `email` | Thin SMTP wrapper. Becomes a no-op when SMTP is unconfigured. |
| `reminder` | Background goroutine that fires exam-reminder emails/notifications. |

### Inside `frontend/src/`

```
src/
├── main.tsx, App.tsx       # React bootstrap.
├── app/routes.tsx          # Central route table (every URL → component).
├── contexts/               # AuthContext keeps the logged-in user globally.
├── components/             # Generic UI (buttons, layout, shadcn components).
├── features/               # One folder per feature area.
│   ├── auth/               #   login, signup, password reset
│   ├── dashboard/          #   teacher and student dashboards
│   ├── exams/              #   exam builder, exam taker
│   ├── courses/            #   class views
│   ├── grading/            #   manual grading queue
│   ├── playground/         #   "run code" sandbox
│   ├── results/            #   results review screens
│   ├── settings/           #   profile/notification settings
│   └── social/             #   announcements, messages, leaderboards, teams
├── pages/                  # Index and 404.
├── hooks/, lib/, assets/   # Reusable hooks, helpers, static assets.
└── test/                   # Vitest setup and tests.
```

The mental model: **`features/` = user-facing screens, `components/` =
reusable building blocks, `app/routes.tsx` = the map**.

---

## 6. How a Request Travels Through the System

Walk through a single example: a student clicks "Submit" on a coding question.

1. **Browser** — React calls a function from `features/exams/...` which uses
   TanStack Query to `POST /api/submissions` with the student's code and the
   problem ID. The JWT is attached as `Authorization: Bearer <token>`.
2. **Gin router** — `main.go` registered every package's routes. The request
   matches the `protected` group, so `middleware.Auth` runs first.
3. **Auth middleware** — verifies the JWT signature using `JWT_SECRET`,
   pulls out `user_id` and `role`, and stashes them on the Gin context. If
   the token is missing or invalid, it returns 401 immediately.
4. **Role middleware** — for student-scoped routes,
   `middleware.RequireRole("student")` checks `role == "student"`. If not,
   403.
5. **Handler** — `internal/submission/handlers.go` opens a transaction:
   creates a `Submission` row in `pending` status, looks up all
   `TestCase` rows for the problem.
6. **Judge0** — the grader (`internal/judge0/grader.go`) sends each test
   case's input to Judge0. Judge0 compiles and runs the code in a sandbox
   and returns stdout, stderr, time, memory, and an exit status.
7. **Compare outputs** — the grader normalizes whitespace and compares
   actual vs expected output for each test case. Each comparison becomes a
   `TestResult` row.
8. **Aggregate** — score is `passed_count / total_count * 100`. The
   submission status flips to `passed` or `failed`. The parent
   `ExamAttempt`'s total score is recomputed (excluding any submissions
   still in `pending_review`).
9. **Response** — JSON with the new submission and per-test breakdown.
10. **Frontend** — TanStack Query caches the result and re-renders the page
    showing which tests passed.

The same pattern holds for every endpoint: **router → auth middleware →
role middleware → handler → DB (and maybe Judge0) → JSON response**.

---

## 7. The Database, Explained Like a Spreadsheet

Imagine each table as one tab in a spreadsheet.

- **Users** — every account. Has a role: teacher or student.
- **UserProfile** — bio, avatar, notification preferences. One per user.
- **Classes** — a class belongs to one teacher. Has an invite code.
- **ClassMembers** — links students to classes (many-to-many).
- **Exams** — owned by a teacher. Has a duration, optional start/end, draft
  flag, practice flag, shuffle flag, passing score.
- **ExamClass** — assigns an exam to one or more classes.
- **Problems** — one row per question. Three flavors:
  - **coding** — has test cases, language hints.
  - **mcq** — has `options` and `correct_option_ids` stored as JSONB.
  - **written** — has a rubric, max word count, manual-grading flag.
  - A problem either belongs to an exam, or lives in the **question bank**
    (`is_bank=true`) for reuse.
- **TestCases** — input / expected output / points / sample-or-not, attached
  to a coding problem.
- **ExamAttempts** — one row per (student, exam). Holds the running total
  score and a `graded_notified` flag so we only send the "your exam was
  graded" notification once.
- **Submissions** — one row per (attempt, problem). Status moves through
  `pending → running → passed | failed | pending_review`. Carries the code
  or selected options or text answer, and optional `teacher_feedback`.
- **TestResults** — one row per (submission, test case). The receipt of what
  Judge0 returned.
- **Folders** — let teachers group bank questions.
- **Announcements** — per-class, with attachments stored as JSONB.
- **Notifications, Messages, Teams, TeamMembers, PasswordResetTokens** —
  exactly what the names suggest.

The big idea: **a Submission is a student's attempt at one Problem inside one
Exam, and it gets graded by Judge0 into a list of TestResults.**

---

## 8. Key User Flows, Step by Step

### A) Teacher creates and assigns an exam

1. Teacher signs up, role = teacher.
2. Creates a class. Backend generates an 8-char invite code.
3. Creates an exam (initially a draft). Adds problems — either picks from
   the question bank or writes new ones. Adds test cases for coding ones.
4. Sets duration, start time, passing score, etc.
5. Publishes the exam (flips `is_draft` off).
6. Calls "Assign" with one or more class IDs → rows in `ExamClass`.
7. Each enrolled student now sees the exam in their list. The reminder job
   will eventually email/notify them.

### B) Student takes the exam

1. Student joins the class with the invite code.
2. Opens the exam. Frontend calls `POST /student/exams/:id/start`, which
   creates an `ExamAttempt` row and returns the questions (shuffled if the
   exam has shuffle on).
3. Student writes code/picks answers/types text. The frontend autosaves
   each answer to the backend, so a refresh resumes where they left off.
4. For coding problems, they can hit "Run sample tests" → the playground
   runs only the test cases marked `is_sample=true`.
5. They click Submit. The frontend posts each problem's answer as a
   `Submission`. The grader runs (see section 9). The attempt's total score
   updates.
6. If `show_results_after` is true, the student sees their results
   immediately. Otherwise they wait for the teacher to release them.

### C) Teacher grades written answers

1. Teacher opens `/teacher/grading/pending`. Backend returns all submissions
   in `pending_review` status.
2. For each one, teacher reads the answer, picks a score, optionally writes
   feedback, and submits.
3. `PUT /submissions/:id/grade` updates the row, flips status from
   `pending_review` to `passed`/`failed`, and recomputes the parent
   `ExamAttempt`'s total score.
4. Once the last pending submission is graded, the attempt is "fully
   graded" and a notification fires to the student.

---

## 9. Code Execution: How Judge0 Grades Code

Judge0 is an external service that does one thing: **given source code, a
language, and stdin, run it in a sandbox and return stdout, stderr, exit
code, time, and memory**.

`internal/judge0/client.go` is a thin HTTP client around it. It maps friendly
names ("python") to Judge0's numeric language IDs.

`internal/judge0/grader.go` is the grading brain:

1. For each test case attached to the problem, send a Judge0 request with
   the student's code and the test's input.
2. Take Judge0's stdout and **normalize** it: strip trailing whitespace,
   convert line endings, strip a trailing newline. Same for the expected
   output. This avoids false negatives caused by `print` vs `println`.
3. Compare strings. If they match, the test passes.
4. Compute `score = passed / total * 100`.
5. For MCQ, no Judge0 call — just set-equality on selected option IDs vs
   `correct_option_ids`.
6. For written, no auto-grade — submission goes to `pending_review`.

`POST /submissions/run` and `POST /execute` use the same Judge0 client but
**don't grade** — they just return the raw output for the playground UI.

---

## 10. Auth: Signing In and Staying Signed In

- Passwords are hashed with **bcrypt** before storage. The plain password is
  never stored or logged.
- On successful login or signup, the backend creates a **JWT** (JSON Web
  Token) signed with `JWT_SECRET` using HS256. The token's payload contains
  the user ID, role, and an expiration timestamp.
- The frontend keeps the token in memory / localStorage and attaches it to
  every protected request as `Authorization: Bearer <token>`.
- On every protected request, `middleware.Auth` verifies the signature and
  expiration before letting the request through. Tampering with the token
  changes the signature and gets rejected.
- **Google sign-in** works by having the frontend ask Google for an ID
  token, then sending that token to `POST /auth/google`. The backend
  verifies it against Google's public certs and either creates a new user
  or links by `google_id`. Either way, it then issues our own JWT.
- **Password reset**: `/auth/forgot-password` creates a one-time
  `PasswordResetToken` row. If SMTP is configured, the link is emailed;
  otherwise it's logged to stdout (dev mode).

---

## 11. Background Jobs (Reminders)

Most apps use a separate worker process for background jobs. We don't —
APEX runs a single goroutine inside the main backend process.
`internal/reminder/scheduler.go` ticks on a timer and looks for:

- Exams starting within an hour → send an in-app notification and
  optionally an email.
- Exams starting now → email students who opted in.
- Newly fully-graded attempts → notification to the student.

Each notification type has a dedicated timestamp column on the row
(`reminder_sent_at`, `email_reminder1h_sent_at`, etc.). The job sets the
column when it sends, and skips rows where it's already set. **This means a
restart can never re-send a notification** — the dedup state lives in the
database, not in memory.

---

## 12. The Migration Rule You Must Not Break

There's a story behind `ORM_RULES.md`. Once upon a time, someone added
`gorm:"default:true"` to a struct field on an existing table. GORM's
AutoMigrate then tried to add the column with a default, but on Postgres a
default applies only to **new** rows — every existing row got the SQL `NULL`
default and the app started filtering them out, making everyone's exams
"vanish."

The lesson, baked into the codebase:

1. For changes to **existing tables** — adding columns, backfilling values,
   adding NOT NULL — write **explicit, idempotent SQL** in
   `internal/database/migrations.go`. This runs in `RunMigrations` *before*
   AutoMigrate.
2. **AutoMigrate is only for brand-new tables.**
3. `RunPostMigrations` runs after AutoMigrate to add things that depend on
   GORM-created tables (like foreign keys to a fresh table).
4. **Never** put `gorm:"default:X"` on a field of an already-populated
   table without a matching SQL migration.

If anyone asks "how do you do migrations?" — that's the answer.

---

## 13. The Frontend in 5 Minutes

- `main.tsx` mounts `<App />` into the root div.
- `App.tsx` wraps everything in providers: `QueryClientProvider` (TanStack
  Query), `AuthProvider` (custom context), router, theme.
- `app/routes.tsx` is the central route table. Every URL maps to a page
  component. Auth-required routes are wrapped in a guard component that
  redirects to login if there's no token.
- Each `features/<area>/` folder typically contains:
  - One or more **page components** (the screens).
  - **Hooks** that wrap TanStack Query calls (`useExams`, `useSubmissions`).
  - **Form schemas** using Zod for validation.
  - Local components specific to that feature.
- Shared things — buttons, dialogs, layout — live in `components/`.
- Styling is **Tailwind utility classes**. Anywhere you see
  `className="flex gap-2 rounded-lg bg-primary"` that's Tailwind.
- API calls are usually centralized in a small `api.ts` per feature that
  uses `fetch` + the auth token from the context.

---

## 14. Common Questions a Reviewer Might Ask

**Q: Why a single Go process instead of microservices?**
A: For a classroom-scale app it's overkill to split into multiple services.
A monolith is faster to develop, easier to deploy, and the package
boundaries inside `internal/` already give us logical separation. We can
extract a service later if any part outgrows the others.

**Q: Why JWT instead of server-side sessions?**
A: Statelessness. Any backend instance can verify a token without a shared
session store. Trade-off: we can't easily revoke a token mid-life, so we
keep expirations short and rely on password change flows for forced
logouts.

**Q: How do you prevent students from cheating by inspecting the API?**
A: Honest answer — we can't fully prevent client-side cheating in a
browser-based exam. We do reduce it: the timer is enforced server-side
(start time recorded in `ExamAttempt`), submissions can be locked once
submitted, and `show_results_after` lets teachers withhold answers. For
high-stakes exams a real proctoring solution is needed.

**Q: How do you sandbox code execution?**
A: We don't run code on our backend at all. Judge0 runs in its own
container with strict resource limits (CPU time, memory, no network) and
returns only stdout/stderr. Our backend just compares strings.

**Q: What happens if Judge0 is down?**
A: The grader returns an error and the submission stays in `pending`
(or fails the request, depending on the entry point). The student can
re-submit when Judge0 is back. Production deployments should run a
self-hosted Judge0 with a queue.

**Q: How do you handle output comparison? Whitespace is tricky.**
A: We normalize both strings before comparing — strip trailing whitespace
on each line, normalize line endings, and strip the trailing newline.
That covers the common "Python `print` adds a newline" gotcha.

**Q: Why GORM and not raw SQL?**
A: Speed of development and type-checked struct definitions. The trade-off
is that GORM's AutoMigrate is dangerous on existing tables, which is why we
have the explicit migration rules in `ORM_RULES.md`.

**Q: How do you do schema migrations safely?**
A: See section 12. SQL-first for existing tables, AutoMigrate for new ones.

**Q: What about scalability?**
A: The bottleneck would be Judge0 first, then the database. The Go process
itself can handle thousands of concurrent requests. Postgres handles this
size of data trivially. Judge0 is the part you'd horizontally scale or
queue first.

**Q: Why is the backend port hardcoded?**
A: Pragmatism for a dev-first project. Easy to change to env-driven later.

**Q: Why store avatars and announcement attachments as base64/JSONB?**
A: Avoids needing object storage (S3) for a small app. For production
you'd swap in S3 — the model field already holds a URL string, so it's a
drop-in change.

**Q: How does the timer work for exams?**
A: When a student calls `start`, we record the start timestamp on
`ExamAttempt`. The frontend shows a countdown derived from that timestamp
plus the exam's duration. The backend rejects submissions that arrive
after the deadline. Trusting only the server's clock is the key idea.

**Q: How do you prevent double-submission of the same exam?**
A: `ExamAttempt` is keyed on (student, exam). On `start`, we check for an
existing attempt and return it instead of creating a new one. On submit,
we mark it submitted.

**Q: Why is `pending_review` excluded from the aggregate score?**
A: A student who's done the coding part but is awaiting written grading
shouldn't see their score artificially depressed. Once the teacher grades
the written submission, it gets included.

---

## 15. Glossary

- **JWT** — a signed token that proves who you are. Sent on every request.
- **Bcrypt** — slow, salted password hashing algorithm. Resists brute force.
- **GORM** — the Go ORM mapping structs to database tables.
- **AutoMigrate** — GORM's "create or alter tables to match my structs" call.
  Safe for new tables, dangerous for existing ones (see section 12).
- **JSONB** — Postgres column type for indexed JSON. Used for MCQ options,
  attachments, etc.
- **CORS** — Cross-Origin Resource Sharing, the browser's "is the API
  allowed to talk to me?" check. Configured in `internal/middleware/cors.go`.
- **Middleware** — a function that runs before/after a request handler.
  We use it for CORS, auth, and role checks.
- **Goroutine** — Go's lightweight concurrent function. The reminder
  scheduler runs as one.
- **Idempotent** — a migration is idempotent if running it twice has the
  same effect as running it once. Required so we can re-run safely.
- **Monaco** — the code editor component that powers VS Code. We embed it
  in the browser for students.
- **Judge0** — open-source code execution sandbox. We POST code, it
  returns stdout/stderr.
- **TanStack Query** — frontend library that caches API responses and
  manages loading/error state.
- **shadcn/ui** — a collection of accessible React components built on
  Radix UI primitives that you copy into your codebase.
- **Vite** — the dev server and build tool for the frontend.
- **Gin** — the Go HTTP framework we use, similar in spirit to Express.

---

If anyone asks something not covered here, the best move is to point at the
relevant package in `internal/` and walk through the file. Every feature
follows the same pattern: a `routes.go`, handler files, and the matching
GORM model in `internal/models/`.
