# CodeJudge — Project Roadmap

## Status: All Core Parts Complete + Styling Pass Done

All 7 parts of the initial plan have been implemented. The UI follows the `hello-portal-blueprint/` floating glassmorphic design system. A comprehensive styling consistency pass has been completed across all dashboard pages and shell components.

---

## What's Built

### Part 1: Auth + Users — DONE
- PostgreSQL + GORM, signup/login with JWT
- Auth pages (blueprint design with `auth-bg.jpg`/`auth-hero.jpg`)
- Protected routes, `useAuth` hook, role-based access
- Editor playground (`/editor`)
- **Table**: `users`

### Part 2: Classes — DONE
- Teacher creates classes with auto-generated 6-char invite codes
- Students join classes via invite code
- Teacher views class members, deletes classes
- **Tables**: `classes`, `class_members`
- **API**: `POST/GET /api/classes`, `GET/DELETE /api/classes/:id`, `POST /api/classes/join`, `GET /api/student/classes`

### Part 3: Exams & Problems — DONE
- Teacher creates exams with title, description, duration, schedule
- Problems with difficulty, starter code (per language), hints, time/memory limits
- Test cases (sample + hidden) per problem
- Assign exams to classes
- **Tables**: `exams`, `problems`, `test_cases`, `exam_classes`
- **API**: Full CRUD for exams, problems, test cases + `POST /api/exams/:id/assign`

### Part 4: Student Dashboard — DONE
- Student dashboard with stat cards, join class form, recent exams
- Classes page (joined classes grid)
- Exams page with tabs: Active | Upcoming | Completed
- Status logic based on `start_time`/`end_time` vs now
- **API**: `GET /api/student/exams`, `GET /api/student/exams/:id`

### Part 5: Exam Taking — DONE
- Full-screen LeetCode-style split-pane UI (`/exam/:id`)
- Problem description (left) + Monaco editor (right) + test results (bottom-right)
- Bottom bar: problem navigation tabs + countdown timer
- Run (sample tests only) and Submit buttons
- Auto-submit on timer expiry
- Language selector (Python, JavaScript, C, C++)
- **Table**: `submissions`
- **API**: `POST /api/submissions`, `POST /api/submissions/run`, `GET /api/submissions/:id`

### Part 6: Auto-Grading Engine — DONE
- Async grading via goroutines (submit returns immediately)
- Runs code against all test cases via Judge0
- Compares stdout to expected output, calculates score = (passed/total) * 100
- Sample test cases: full detail (input, expected, actual)
- Hidden test cases: pass/fail only
- **Table**: `test_results`
- **Engine**: `backend/grading/grader.go`

### Part 7: Results & Analytics — DONE
- Teacher: exam results table grouped by student, CSV export
- Teacher: class stats (avg score, pass rate)
- Student: submission history table, click for detail view
- Student: submission detail with code viewer + test results
- **API**: `GET /api/exams/:id/results`, `GET /api/exams/:id/results/export`, `GET /api/classes/:id/stats`, `GET /api/student/submissions`

---

## Styling Consistency Pass — DONE

Standardized all dashboard pages and shell components:

- **Shared components**: Created `LoadingSpinner.tsx` (animated spinner) and `StatusBadge.tsx` (unified badge for all statuses with border + theme tokens)
- **Page titles**: All `<h1>` tags use `text-2xl font-bold tracking-tight text-foreground` consistently
- **Loading states**: All pages use `<LoadingSpinner />` instead of bare "Loading..." text
- **StatusBadge**: Removed 3 duplicate local definitions (teacher/ExamsPage, teacher/ExamResultsPage, student/SubmissionsPage), replaced inline status badges (student/DashboardPage, student/ExamsPage) — all now use the shared component with `border` class and theme tokens (no raw green/red colors)
- **Stat cards**: ClassDetailPage raw stat divs replaced with `<StatCard>` component (matches OverviewPage)
- **Button padding**: Create/Cancel buttons in ClassesPage normalized to `py-2.5`
- **CTA button**: OverviewPage "Create Exam" button `rounded-xl` → `rounded-lg`
- **Chart grid**: OverviewPage chart layout uses `xl:grid-cols-5` breakpoint for better proportions
- **Navbar**: All pill containers and tab/icon buttons use `rounded-full` consistently (was mixed `rounded-2xl`/`rounded-xl`)
- **Sidebar**: All icon buttons use `rounded-full` (was `rounded-xl`), settings group container `rounded-2xl` → `rounded-full`

---

## Design System (from `hello-portal-blueprint/`)

All dashboard pages use the portal floating UI design:

- **Background**: `auth-bg.jpg` (fixed) + `bg-background/85` tint overlay
- **Floating navbar**: 4 pill containers (logo, nav tabs, action icons, profile) — `rounded-full bg-card/80 backdrop-blur-md shadow-lg`
- **Floating sidebar**: 3 stacked pill sections (main nav, secondary, help/logout) — all `rounded-full`
- **Cards**: `border-border/50 bg-card/80 backdrop-blur-md` throughout
- **Stat cards**: `<StatCard>` component with icon boxes and primary/accent highlighted variants
- **Status badges**: `<StatusBadge>` component with `border` class, theme tokens only
- **Loading states**: `<LoadingSpinner>` component with animated spinner
- **Warm dark theme**: HSL CSS variables (orange primary, amber accent)
- **Charts**: Recharts bar charts with theme colors
- **Icons**: Lucide React
- **UI primitives**: shadcn (Button, Input, Checkbox)

---

## Project Structure

```
backend/
├── config/config.go           # DB + Judge0 config
├── database/database.go       # GORM connection + AutoMigrate
├── grading/grader.go          # Auto-grading engine
├── handlers/
│   ├── auth.go                # Signup, login
│   ├── analytics.go           # Exam results, class stats, CSV export
│   ├── classes.go             # Class CRUD, join
│   ├── exams.go               # Exam CRUD, assign to classes
│   ├── execute.go             # Code execution (playground)
│   ├── problems.go            # Problem + test case CRUD
│   ├── student.go             # Student exams (with status logic)
│   └── submissions.go         # Submit, run, get results
├── middleware/auth.go          # JWT auth + RequireRole
├── models/
│   ├── user.go
│   ├── class.go               # Class + ClassMember
│   ├── exam.go                # Exam + ExamClass
│   ├── problem.go             # Problem + TestCase
│   ├── submission.go
│   └── test_result.go
└── main.go                    # Routes + server

frontend/src/
├── components/
│   ├── DashboardLayout.tsx    # Portal layout shell
│   ├── Navbar.tsx             # Floating navbar (4 pills)
│   ├── Sidebar.tsx            # Floating sidebar (3 pill groups)
│   ├── StatCard.tsx           # Stat card with variants
│   ├── StatusBadge.tsx        # Unified status badge (all statuses)
│   ├── LoadingSpinner.tsx     # Animated loading spinner
│   ├── SubmissionsChart.tsx   # Recharts bar chart
│   ├── ProtectedRoute.tsx
│   └── ui/                    # shadcn primitives
├── pages/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── EditorPage.tsx         # Playground
│   ├── ExamPage.tsx           # LeetCode-style exam UI
│   ├── teacher/
│   │   ├── OverviewPage.tsx
│   │   ├── ClassesPage.tsx
│   │   ├── ClassDetailPage.tsx
│   │   ├── ExamsPage.tsx
│   │   ├── ExamBuilderPage.tsx
│   │   ├── ProblemEditorPage.tsx
│   │   ├── ExamResultsPage.tsx
│   │   └── ClassStatsPage.tsx
│   └── student/
│       ├── DashboardPage.tsx
│       ├── ClassesPage.tsx
│       ├── ExamsPage.tsx
│       ├── SubmissionsPage.tsx
│       └── SubmissionDetailPage.tsx
├── hooks/useAuth.ts
├── api.ts                     # All API functions + types
└── main.tsx                   # Router setup

hello-portal-blueprint/       # Design reference (static mockup)
```

---

## Database Schema

```
users            → id, email, password_hash, role, name, created_at
classes          → id, teacher_id, name, section, invite_code, created_at
class_members    → id, class_id, user_id, joined_at
exams            → id, teacher_id, title, description, duration_minutes, start_time, end_time, created_at
exam_classes     → id, exam_id, class_id
problems         → id, exam_id, title, description, difficulty, starter_code, hints, time_limit_ms, memory_limit_kb, order_index, created_at
test_cases       → id, problem_id, input, expected_output, is_sample, order_index
submissions      → id, user_id, problem_id, exam_id, language, code, status, passed_count, total_count, score, execution_time_ms, memory_kb, submitted_at
test_results     → id, submission_id, test_case_id, passed, actual_output, execution_time_ms, memory_kb, status
```

---

## Potential Future Work

- **Real-time exam monitoring**: WebSocket updates for teacher to see live submission activity
- **Plagiarism detection**: Code similarity analysis across student submissions
- **Problem bank**: Reusable problem library across exams
- **Student analytics**: Performance trends over time, skill breakdown charts
- **Notifications**: Email/in-app notifications for exam start, results available
- **Admin panel**: System-wide user management, Judge0 health monitoring
- **Dark/light theme toggle**: Theme switcher (sidebar has placeholder icon)
- **Settings page**: User profile editing, password change
- **Pagination**: For submissions, results, and class members lists
- **Search & filtering**: Filter exams by status, submissions by problem/score
