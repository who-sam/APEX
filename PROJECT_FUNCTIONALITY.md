# Kernel - Coding Exam Platform

Kernel is a full-stack web application for managing and taking coding exams. It supports two user roles — **Teachers** and **Students** — each with dedicated dashboards and workflows.

## Tech Stack

- **Backend:** Go (Gin framework), PostgreSQL (GORM), JWT authentication
- **Frontend:** React + TypeScript (Vite), Tailwind CSS, shadcn/ui components, Monaco code editor
- **Code Execution:** Judge0-compatible execution engine for running/grading student code

---

## Authentication

- Email + password signup with role selection (teacher or student)
- JWT-based session management stored in localStorage
- Role-based route protection (students can't access teacher pages and vice versa)
- Multi-tab sync — logging out in one tab logs out all tabs
- Password change functionality

---

## Teacher Features

### Class Management
- Create classes with a name and section
- Each class gets a unique 6-character invite code (auto-generated)
- View all classes with member count
- View class detail: member list, assigned exams
- Class statistics: member count, exam count, total submissions, average score, pass rate
- Delete classes (cascades to memberships and exam assignments)

### Exam Management
- Create exams with title, description, and duration
- Schedule exams with start and end times
- Edit exam metadata (title, description, duration, schedule)
- Delete exams (cascades to problems and test cases)
- Assign exams to one or more classes (students in those classes can take the exam)

### Problem Management
- Add problems to exams with: title, description, difficulty (easy/medium/hard), starter code
- Edit problems: all fields including hints, time limits, memory limits
- Delete problems (cascades to test cases)
- Reorder problems within an exam

### Test Case Management
- Add test cases to problems with input and expected output
- Mark test cases as "sample" (visible to students) or "hidden" (used for grading only)
- Edit and delete test cases
- Test cases are ordered and displayed in a table

### Results & Analytics
- View exam results per student: score, pass rate, submission count
- Detailed submission view with test results
- Export exam results as CSV
- Overview dashboard with key statistics

### Messaging
- Send direct messages to users
- View received messages
- Star/unstar and mark as read/unread
- Delete messages

---

## Student Features

### Class Enrollment
- Join classes using a 6-character invite code from the teacher
- View all enrolled classes with member count and invite code
- Share invite codes with classmates

### Exam Taking
- View all exams assigned to enrolled classes
- Exam status tracking: upcoming, active, completed
- Multi-problem exam interface with:
  - Problem statement with description, difficulty badge, and hints
  - Monaco code editor with syntax highlighting
  - Language selector: Python 3, JavaScript, C, C++
  - Run button: test code against sample test cases (immediate feedback)
  - Submit button: submit solution for full grading (sample + hidden test cases)
  - Timer countdown (turns red when < 5 minutes remain)
  - Problem tabs to switch between problems (marks submitted problems)
  - Code persists in memory when switching between problems
  - Exam re-entry: previously submitted code is restored when re-entering an exam
  - Timer calculates remaining time from `start_time + duration` (not just raw duration)
  - Graceful handling when no sample test cases exist (shows helpful message instead of "Some Failed")

### Code Playground
- Free-form code editor (not tied to any exam)
- Write and execute code in any supported language
- Stdin input support via an "Input (stdin)" tab — enables programs that read from stdin (e.g. Python `input()`)
- View stdout, stderr, compile errors, execution time, and memory usage

### Results & History
- View all past submissions
- Submission details: status, score, passed/total test cases, execution time, memory

### Dashboard
- Welcome greeting with stats cards: exams taken, average score, pass rate, total submissions
- Performance chart (monthly score trends)
- Skill breakdown by difficulty level
- Upcoming exams widget
- Recent results widget

### Other
- Profile settings: bio, notification preferences (email, push, exam reminders, results)
- Messaging: view, star, send messages
- Team management: create/join teams with members

---

## Code Execution & Grading

1. **Execute (playground):** Free-form code execution with optional stdin input. Results include stdout, stderr, compile output, execution time, and memory.
2. **Run (instant feedback):** Student runs code against sample test cases only. Results show input, expected output, actual output, and pass/fail for each sample case.
3. **Submit (full grading):** Submission is created with status "pending". An async goroutine executes the code against ALL test cases (sample + hidden). Each test case produces a TestResult record. The submission is updated with: status (accepted/wrong_answer/etc.), passed count, total count, and score. Server-side time enforcement rejects submissions after the exam's `end_time`.
4. **Supported languages:** Python 3, JavaScript, C, C++

---

## Database Schema

| Table | Purpose |
|-------|---------|
| User | Accounts with email, password hash, role, name |
| Class | Teacher-owned classes with invite codes |
| ClassMember | Student-class enrollment (many-to-many) |
| Exam | Exams with title, schedule, duration |
| ExamClass | Exam-to-class assignment (many-to-many) |
| Problem | Coding problems within exams |
| TestCase | Input/output pairs for problems (sample or hidden) |
| Submission | Student code submissions with grading results |
| TestResult | Per-test-case results for a submission |
| UserProfile | Bio and notification preferences |
| Message | Direct messages between users |
| Team | Collaborative teams |
| TeamMember | Team membership |

---

## UI Design

- Dark-themed with glassmorphism effects (backdrop blur, translucent cards)
- Floating navbar at top with nav tabs and profile dropdown
- Icon sidebar on the left with tooltips
- Responsive grid layouts
- Geometric pattern background with gradient overlay
- shadcn/ui component library (40+ components)
- Monaco editor for code editing with full syntax highlighting
