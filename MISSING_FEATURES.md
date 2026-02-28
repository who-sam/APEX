# Missing Features, UI Gaps & Problems

A comprehensive list of what's missing or could be improved in the Kernel platform.

---

## Critical Missing Features

### 1. No Student Classes Page (FIXED)
- ~~Students had no way to view their enrolled classes or join new ones~~ — now added at `/dashboard/classes` with a join-by-invite-code dialog.

### 2. No "Get Problem" API Endpoint (FIXED)
- ~~The Problem Editor page had to call `updateProblem(id, {})` with an empty body just to fetch problem data~~ — a dedicated `GET /problems/:id` endpoint now exists that returns the problem with its test cases, and `ProblemEditorPage` uses it via `getProblem()`.

### 3. No Real-Time Submission Status Updates
- After a student submits code, grading happens asynchronously but there's no mechanism (WebSocket, SSE, or polling) to notify the student when grading finishes.
- The student has to manually refresh or navigate away and back to see results.
- Should implement polling or WebSocket-based real-time updates.

### 4. No Exam Time Enforcement (FIXED)
- ~~The exam timer counted down on the frontend but there was no server-side enforcement~~ — `SubmitSolution` now loads the exam and rejects submissions with 403 "exam has ended" if the current time is past `end_time`.

### 5. No Duplicate Submission Prevention
- Students can submit the same problem multiple times during an exam with no limits.
- No "best score" or "latest score" logic — unclear which submission counts.
- Should decide on a scoring policy (best of N, latest, first accepted, etc.) and enforce it.

### 6. No Exam START Time Enforcement
- The backend checks `end_time` to reject late submissions, but does NOT check `start_time`.
- Students can submit solutions BEFORE the exam officially starts.
- `SubmitSolution` in `submissions.go` only validates `end_time`, not `start_time`.
- Should reject submissions with 403 "exam has not started yet" if current time is before `start_time`.

### 7. No Student Enrollment Verification on Submission
- When a student submits or runs code, the backend does NOT verify the student is enrolled in a class that's assigned to the exam.
- Any authenticated student who knows a problem ID could submit a solution to an exam they shouldn't have access to.
- `SubmitSolution` and `RunSolution` in `submissions.go` should verify the student is in a class linked to the exam via `exam_classes`.

---

## Missing UI / Pages

### 8. No Student Submission Detail Page (PARTIALLY FIXED)
- ~~Students had no way to view a single submission's full details~~ — Results.tsx now has a "View" button that opens a dialog with submission details via `getSubmission()`.
- However, it's a dialog, not a dedicated page — no shareable URL, no full code viewer, limited space for long outputs.

### 9. No Teacher Overview Dashboard Stats (FIXED)
- ~~The teacher Overview page showed placeholder data~~ — `OverviewPage.tsx` now fetches real data from `getClasses()`, `getExams()`, and `getExamResults()` to display total classes, exams, students, problems, and recent exam results.

### 10. No Exam Status/Publishing Workflow
- Exams have no "draft" vs "published" state.
- Once created, an exam is immediately visible to assigned classes.
- Should support: Draft → Published → Active → Completed lifecycle.

### 11. Confirmation Dialogs Incomplete (PARTIALLY FIXED)
- ~~Deleting classes had no confirmation~~ — `ClassDetailPage.tsx` now has a delete confirmation dialog.
- But deleting exams, problems, and test cases still happens immediately with no "Are you sure?" confirmation.
- Should add confirmation dialogs for all destructive operations.

### 12. No Search/Filter on Any List Page
- No search bar on classes list, exams list, results list, or messages.
- As data grows, finding specific items will become difficult.

### 13. No Pagination
- All list endpoints return all records with no pagination.
- Will cause performance issues as data scales.
- Affects: classes, exams, submissions, messages, results, teams.

### 14. Help Page is a Static Stub
- `Help.tsx` has 6 hardcoded FAQ items with no API or CMS behind them.
- "Contact Support" button does nothing (no link, no form, no email).
- "Resources" cards are not clickable and link nowhere.
- Should either implement a real help system or link to external docs.

### 15. Skill Breakdown Uses Hardcoded Placeholder Data
- `SkillBreakdown.tsx` in the student dashboard displays hardcoded skills: JavaScript (88%), Python (92%), React (75%), SQL (78%), Data Structures (65%).
- This data is NOT fetched from any API — it's static mock data.
- No backend endpoint exists to calculate per-language or per-topic skill levels.
- Should either build a real skill tracking system or remove the component.

### 16. No Compose/Send Message UI for Students
- `Messages.tsx` shows an inbox (received messages) with read, star, and delete actions.
- But there is no visible "Compose" or "New Message" button for students to send messages.
- The `createMessage()` API function exists in `lib/api.ts` but the UI doesn't expose it for students.
- Teachers and students should be able to initiate conversations.

### 17. No Problem Preview for Teachers
- Teachers edit problems in `ProblemEditorPage.tsx` but have no way to preview how the problem will appear to students in the exam-taking interface.
- Should add a "Preview" button that shows the problem as students would see it (description, sample test cases, starter code in Monaco editor).

### 18. No "Leave Exam" Confirmation
- During an exam (`ExamTaking.tsx`), navigating away or closing the tab has no warning dialog.
- Students could accidentally lose their progress by clicking the back button or closing the browser.
- Should add a `beforeunload` event listener and/or an in-app confirmation dialog.

### 19. No Exam Instructions Screen Before Starting
- When a student clicks "Start Exam," they're immediately taken to the code editor.
- No instructions page showing: exam rules, number of problems, time limit, allowed languages, or "are you sure you want to start?" confirmation.
- Starting the exam should be a deliberate action with full awareness of the rules.

---

## Backend Gaps

### 20. No Input Validation on Several Endpoints
- Exam `duration_minutes` accepts any integer (including negative).
- `start_time` can be set to the past.
- `end_time` can be before `start_time`.
- Problem `time_limit_ms` and `memory_limit_kb` have no upper bounds.
- Test cases accept empty input and empty expected_output with no warning.

### 21. No Rate Limiting
- No rate limiting on code execution (`/execute`), submission, or auth endpoints.
- A student could spam the execution endpoint.
- Login endpoint can be brute-forced with no throttling.

### 22. No CORS Configuration
- The backend likely needs proper CORS headers for production deployment.
- Currently works in development because both run on localhost.

### 23. No File Upload / Image Support
- Problem descriptions are plain text only.
- No support for images, diagrams, or rich text formatting in problem statements.
- Markdown rendering would be a good middle ground.

### 24. No Problem Description Markdown Rendering
- Problem descriptions in the exam-taking view are displayed as plain text.
- Should render Markdown so teachers can format descriptions with code blocks, lists, bold/italic, etc.

### 25. No Team Delete or Remove Member Endpoints
- `CreateTeam` and `AddTeamMember` endpoints exist and work.
- But there are NO endpoints for: deleting a team, removing a member, updating team name, or transferring admin role.
- A team admin cannot manage their team beyond adding members.

### 26. Execution Time and Memory Never Populated in Test Results
- `TestResult` model has `ExecutionTimeMs` and `MemoryKb` fields.
- The grading engine (`grading/grader.go`) creates `TestResult` records but never populates these fields.
- Students see "0ms" and "0KB" for every test case, which is misleading.
- The Judge0 response likely includes this data — should extract and store it.

### 27. Messages Are Unidirectional Only
- The message system is inbox-only: `GetMessages` returns messages where `to_id` = current user.
- There's no "Sent" folder — senders can't see messages they've sent.
- No conversation threading — each message is standalone with no reply chain.
- No way to view a message thread between two users.

### 28. No Forgot Password / Password Reset
- If a user forgets their password, there's no recovery mechanism.
- No "Forgot Password?" link on the login page.
- No email-based password reset flow.
- The only way to change a password is via Settings, which requires knowing the current password.

### 29. No Email Verification on Signup
- Anyone can sign up with any email address, including fake ones.
- No verification email sent, no activation link, no email confirmation step.
- Could lead to fake accounts or typo-ed email addresses with no recovery path.

### 30. Middleware Type Assertion Panic Risk
- `middleware/auth.go` does `uint(claims["user_id"].(float64))` — if the claim is missing or the wrong type, this panics and crashes the server.
- Should use safe type assertion with comma-ok pattern: `val, ok := claims["user_id"].(float64)`.

### 31. No User Info Endpoint
- There's no `GET /api/user` or `GET /api/me` endpoint that returns the current user's info (name, email, role).
- The frontend stores user info from the login response and never refreshes it.
- If a user's name or role changes, the frontend shows stale data until they log out and back in.

---

## UX Issues

### 32. No Loading States on Some Pages
- Most pages now have loading spinners (improvement over initial state).
- However, navigation between pages still shows nothing during the transition — no top-level progress bar or skeleton loader.

### 33. No Empty States for Several Pages
- Some pages show nothing when data is empty (no helpful illustration or call-to-action).
- Practice page says "No exams available" but doesn't direct the student to join a class.
- Team page with no teams doesn't suggest creating one prominently.

### 34. Inconsistent Toast Notification Usage
- Settings page properly uses toast notifications for save/error feedback.
- But many other pages use inline success text, `alert()`, or no feedback at all.
- The toast/sonner system is set up in `App.tsx` but underused across the app.

### 35. No Mobile Responsiveness
- The sidebar is fixed at `left: 4` with `ml-20` offset on content.
- On mobile screens, the sidebar and navbar overlap with content.
- No hamburger menu or collapsible sidebar for small screens.

### 36. Theme Toggle Doesn't Persist
- The dark/light mode toggle in the sidebar toggles the CSS `dark` class on the document element.
- Refreshing the page resets to dark mode because the preference is not saved to localStorage.
- Should persist the theme choice in localStorage and read it on page load.

### 37. No Breadcrumb Navigation
- Deep pages like ProblemEditorPage (`/teacher/problems/:id`) have no breadcrumbs showing the path: Exams → Exam Name → Problem Name.
- Users rely on the back button, which loses context if they navigated indirectly.

### 38. No Keyboard Shortcuts in Exam Interface
- The exam-taking page has no keyboard shortcuts (e.g., Ctrl+Enter to run, Ctrl+Shift+Enter to submit).
- Power users and competitive programmers expect these shortcuts.
- Monaco editor has built-in shortcut support that could be extended.

---

## Security Concerns

### 39. No CSRF Protection
- API uses JWT in headers which mitigates most CSRF attacks, but there's no explicit CSRF token mechanism.

### 40. Weak Password Requirements
- The backend only enforces a 6-character minimum password length.
- No complexity requirements (uppercase, numbers, symbols), no common password checking, no breach database lookup.

### 41. No Account Lockout
- No brute-force protection on login endpoint.
- Unlimited login attempts allowed with no delay, lockout, or CAPTCHA.

### 42. JWT Token Never Expires Client-Side
- Token is stored in localStorage indefinitely.
- The server sets a 24-hour expiry on the JWT, but the frontend never checks it or refreshes the token.
- No automatic logout on token expiry — the user sees random 401 errors instead.
- Should implement: token expiry detection, automatic logout with "session expired" message, or token refresh flow.

### 43. RunSolution Doesn't Validate Problem Exists
- The `/submissions/run` endpoint doesn't verify that the `problem_id` in the request actually exists in the database.
- Could lead to confusing errors or wasted Judge0 execution cycles.

---

## Feature Ideas (Nice to Have)

### 44. Student-to-Student Code Comparison (Plagiarism Detection)
- Teachers can view individual submissions but there's no tool to compare submissions across students for similarity.

### 45. Exam Analytics / Insights (PARTIALLY EXISTS)
- `ExamResultsPage.tsx` now has score distribution histograms and summary stats (average, highest, pass rate).
- Still missing: per-problem difficulty analysis (which problems had lowest pass rates), time-to-submit analysis, and comparison across exams.

### 46. Problem Bank / Reuse
- Problems are tied to specific exams.
- No way to reuse a problem across multiple exams.
- A shared problem bank would save teachers time.

### 47. Bulk Test Case Import
- Adding test cases one at a time is tedious.
- Should support bulk import from a text file or CSV (input/output pairs).

### 48. Code Execution Sandbox Hardening
- Ensure student code runs in a fully sandboxed environment.
- Prevent: file system access, network access, fork bombs, infinite loops beyond time limit.

### 49. Student Can't See Which Exam a Submission Belongs To
- The results page shows submissions but doesn't display the exam name.
- Hard to tell which exam a submission was for.

### 50. No Exam Rescheduling Notification
- If a teacher changes exam start/end times, students aren't notified.
- Should auto-send a message or push notification.

### 51. No Class Removal
- A student can join a class but there's no way for them to leave.
- A teacher can't remove individual students from a class.

### 52. Team Feature is Incomplete
- Teams can be created and members added, but there's no team-based functionality.
- No team competitions, shared practice sessions, or team leaderboards.
- No delete team, remove member, or transfer ownership operations.

### 53. No Code Auto-Save During Exams
- During an exam, code is stored in component state only.
- If the browser crashes or the tab is accidentally closed, all code is lost.
- Should auto-save code to localStorage or the backend periodically.

### 54. No Multi-Language Starter Code
- The `starter_code` field on a Problem is a single text field.
- Teachers can only provide starter code for one language.
- Should support per-language starter code (e.g., different templates for Python vs C++).

### 55. No Student Leaderboard
- No ranking system for students within a class or across exams.
- Leaderboards can motivate competitive students.

### 56. No Class Announcements
- Teachers have no way to post announcements to an entire class.
- The messaging system is 1-to-1 only — no broadcast or group messages.

### 57. Notification Settings Have No Backend
- `Settings.tsx` shows toggles for email notifications, push notifications, exam reminders, and result alerts.
- The toggles save to `UserProfile` in the database, but there's no notification delivery system.
- No email sending, no push notification infrastructure, no reminder scheduler.
- The settings are stored but never acted upon.

### 58. No Profile Picture / Avatar
- User profiles show a placeholder icon.
- No way to upload a profile picture or set an avatar.
- Could use Gravatar integration as a quick solution.

### 59. No Admin Panel
- No system-wide admin role for managing all users, monitoring Judge0 health, viewing system stats, or managing platform settings.
- Only teacher and student roles exist.

### 60. No Export Student Data
- Teachers can export exam results as CSV, but there's no way to export:
  - All student submissions for a class.
  - Student performance reports across multiple exams.
  - Bulk grade sheets for academic records.
