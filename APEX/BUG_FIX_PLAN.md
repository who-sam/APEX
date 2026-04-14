# APEX Bug-Fix Plan

## Context
Teacher and student sides have many broken flows: exam delete FK violation, grading marks everything failed, compiler error "unsupported language: python", per-question submission sprawl causing notification/result noise, missing draft/closes_at/remove-member endpoints, edit-exam empty, announcements produce no notifications. Goal: restore a working teacher authoring + student exam-taking path end-to-end.

On execution, will also write this plan to `~/workspace/leetcode/APEX/BUG_FIX_PLAN.md` per user request.

## Critical files
### Backend (Go)
- `internal/exam/handler.go` — delete, list, edit, save, status
- `internal/class/handler.go` + `internal/class/routes.go` — remove member
- `internal/submission/handler.go` + `internal/models/submission.go` — per-exam submission model
- `internal/judge0/client.go` — language map
- `internal/judge0/grader.go` — MCQ/written/coding grading
- `internal/announcement/handler.go` — trigger notifications
- `internal/models/exam.go` — add `IsDraft`, ensure `EndTime`/`ClosesAt`
- `internal/problem/handler.go` — question bank endpoints
- `main.go` — route registration

### Frontend (React)
- `frontend/src/features/exams/pages/ExamBuilder.tsx`
- `frontend/src/features/exams/pages/ExamTaking.tsx`
- `frontend/src/features/exams/pages/TeacherExams.tsx`
- `frontend/src/features/exams/pages/UpcomingExams.tsx`
- `frontend/src/features/exams/components/MCQEditor.tsx`
- `frontend/src/features/dashboard/pages/Dashboard.tsx`
- `frontend/src/features/dashboard/pages/TeacherDashboard.tsx`
- `frontend/src/features/courses/pages/CourseDetail.tsx`
- `frontend/src/features/results/pages/Results.student.tsx`
- `frontend/src/features/results/pages/TeacherResults.tsx`
- `frontend/src/features/settings/pages/Settings.tsx`
- `frontend/src/hooks/useAnnouncements.ts`
- `frontend/src/lib/api.ts`

---

## Fix order & approach

### Phase A — Critical (app unusable)

**#17 Compiler "unsupported language: python"** (`internal/judge0/client.go:15`)
Current map: `python3, javascript, c, cpp`. Frontend sends `python`. Add aliases + extra langs:
```go
"python":  71, "python3": 71,
"javascript": 63, "js": 63,
"java": 62, "c": 50, "cpp": 54, "c++": 54,
"go": 60, "rust": 73, "ruby": 72,
```
Verify IDs against Judge0 reference (71=Python3, 63=Node, 62=Java, 50=C, 54=C++17).

**#18 Grading marks everything failed** (`internal/judge0/grader.go`)
- **MCQ** (lines 106-185): selected/correct compared as JSON sets. Likely bug: frontend sends option index vs backend expects option id, or array-of-strings vs array-of-ints. Read ExamTaking submit payload; normalize to sorted id-string sets both sides.
- **Written** (187-202): already sets `pending_review`. Confirm the submission endpoint doesn't overwrite to `failed` downstream.
- **Coding**: confirm Judge0 stdout compared trimmed; ensure expected output normalised (strip trailing newline/CR).

### Phase B — Per-exam submission model (#10, #16, #24, #25)
Root cause: one Submission row per question. Approach (minimal):
1. Add `ExamAttempt` model: `{id, user_id, exam_id, started_at, submitted_at, score, status}`.
2. Add `exam_attempt_id` FK on Submission.
3. New endpoints:
   - `POST /exams/:id/start` → creates attempt (or returns active one)
   - `POST /exams/:id/submit` → finalises attempt, aggregates grade, creates ONE notification
4. Migrate backfill: group existing submissions by (user, exam).
5. Remove per-submission notification creation in `submission/handler.go`; create single notification in exam submit handler.
6. Frontend: `ExamTaking.tsx:348-402` — call single `/exams/:id/submit` with `{answers:[{problem_id,...}]}` instead of looping per-question.
7. Dashboard/Results pages read attempts, not submissions.

### Phase C — Teacher backend fixes

**#1 Delete exam FK** (`internal/exam/handler.go:165-184`)
Use transaction, delete children first:
```go
tx := database.DB.Begin()
tx.Where("exam_id = ?", examID).Delete(&models.Submission{})
tx.Where("exam_id = ?", examID).Delete(&models.ExamClass{})
// delete test_cases via problem ids
var problemIDs []uint
tx.Model(&models.Problem{}).Where("exam_id = ?", examID).Pluck("id", &problemIDs)
tx.Where("problem_id IN ?", problemIDs).Delete(&models.TestCase{})
tx.Where("exam_id = ?", examID).Delete(&models.Problem{})
tx.Where("id = ? AND teacher_id = ?", examID, teacherID).Delete(&models.Exam{})
tx.Commit()
```

**#2 Fake exams** — backend query already filters by teacher_id (exam/handler.go:71). Bug is frontend: `TeacherExams.tsx` may hit non-teacher-scoped endpoint. Audit `frontend/src/lib/api.ts` teacherExams call; switch to `GET /teacher/exams` or `GET /exams?mine=1`.

**#3 Always "upcoming"**
Status compute exists in `student/handler.go:114-122` but teacher list doesn't return status. Add same compute to `GetExams` response. Frontend `TeacherExams.tsx:21-45` `deriveStatus` may be overriding — prefer backend-computed status; fallback to client compute only if nil.

**#4 View submissions**
`GetExamResults` exists at `exam/handler.go:216`. Frontend `TeacherResults.tsx` not wired? Verify api.ts call + UI renders returned list.

**#5 Pending grading queue** — add endpoint:
`GET /teacher/grading/pending` → submissions where `status='pending_review'` and exam.teacher_id=me. Register in main.go. Wire frontend pending-grading widget.

**#6 Remove student from class**
Add `DELETE /classes/:id/members/:userId` in `class/routes.go` + handler:
```go
database.DB.Where("class_id=? AND user_id=?", id, userId).Delete(&models.ClassMember{})
```
Auth: only class teacher.

### Phase D — Teacher UI/logic

**#7 "View Grades" label** (`TeacherResults.tsx:350`) — rename to "View Submission" OR change to open grades breakdown. Pick rename (simpler).

**#8 Edit exam empty** (`ExamBuilder.tsx:91-111`)
On mount when `examId` present, fetch `GET /exams/:id` + `GET /exams/:id/problems`, hydrate `questions`. Add `useQuery` for exam detail. Populate MCQ/written/coding shapes.

**#9 MCQ random text** (`MCQEditor.tsx:104-133`) — ensure `opt.text` is a string. `bankProblemToQuestion` (ExamBuilder:70) deserializes; guard with `typeof === 'string' ? JSON.parse : already-parsed`. Render `String(opt.text ?? '')`.

**#10 closes_at** — already covered in schema. Add datetime input in ExamBuilder after duration; send as `closes_at`. Exam model: rename/confirm `EndTime` vs add `ClosesAt` (`EndTime` already exists — reuse it; UI sets it independently from `start_time + duration`).

**#11 Exam save target** — ExamBuilder save posts problems with `examId` (good). Issue: student side "question bank" lists exam problems. Add `is_bank` flag on Problem; question bank view filters `is_bank=true AND exam_id IS NULL`; exams never go to bank unless explicitly saved there.

**#12 Save-to-bank per-question** (`ExamBuilder.tsx:279-281`)
Implement: `POST /problems/bank` with question payload; set `is_bank=true, exam_id=null`. Frontend button calls this per-question.

**#13 Q-bank dedupe** — on reuse, insert a new Problem **referencing** bank problem (add `source_problem_id` on Problem model). Or simpler: copy-on-use but check by `source_problem_id` to avoid re-copy from same bank entry within same exam. Pick the simpler dedupe.

**#14 Draft exam**
Add `IsDraft bool` on Exam. Default true on create from ExamBuilder unless "Publish" clicked. `TeacherExams.tsx:21-45` filter already checks `is_draft`. Backend list returns it; student-facing queries exclude drafts.

**#15 Danger zone spacing** (`Settings.tsx`) — add `mt-12` wrapper before the Danger Zone card.

**#16 Recent activity per-exam** — after Phase B, reads `ExamAttempt`, one row per attempt. Update `TeacherDashboard.tsx` and `Dashboard.tsx` recent-activity sections.

### Phase E — Student UI/logic

**#19 Announcement notifications** (`internal/announcement/handler.go:43-69`)
After create, for each ClassMember (students), call `notification.Create({user_id, type:'announcement', title, body, link})`. Verify via student notifications poll.

**#20 Exam "failed" on tap** (`CourseDetail.tsx:135-158`) — click handler checks submission; if none, route to `/dashboard/exam/:id/take`. Currently may fall through to "failed". Fix branching: `if (!hasAttempt) goTake; else goReview`.

**#21 Remove difficulty on student side** — search `difficulty` in student files, remove badge rendering in `UpcomingExams.tsx:197`, `Dashboard.tsx:132-134`, `CourseDetail.tsx`, `Courses.tsx`. Keep field in DB for now (no schema change).

**#22 "Prepare" → "Start Exam"** (`UpcomingExams.tsx:214`) — change label.

**#23 Start vs Continue** (`Dashboard.tsx:38-67`) — after Phase B, check for open `ExamAttempt`; if none → "Start Exam", if started-but-not-submitted → "Continue".

**#24 Results per-exam grouping** — after Phase B, `Results.student.tsx:136-165` reads attempts.

**#25 One notification per submission** — covered by Phase B (single `/exams/:id/submit` handler creates one notification).

---

## Verification

### Backend
- `cd ~/workspace/leetcode/APEX && go build ./...` after each backend phase.
- Run server, hit endpoints via curl:
  - Delete exam with children: `DELETE /exams/:id` → 200, no FK error.
  - `GET /teacher/grading/pending` returns pending-review list.
  - `DELETE /classes/:id/members/:uid` removes row.
  - Submit exam → one notification row in DB, one ExamAttempt, status per-question grading correct.
  - Judge0 submit with `language=python` → 200 not "unsupported".

### Frontend
- `cd frontend && npm run dev`, test flows:
  - Teacher: create exam → save as draft → filter by draft → edit → questions populated → publish → status updates. Delete exam succeeds. Remove member from class. View results, view pending grading.
  - Student: see announcement notification, start exam (button says Start), submit → one notification, results page shows one row per exam with aggregated score, code editor compiles Python.

### Regression
- Existing class delete still works.
- Practice mode still works.

---

## Out of scope
- Full question-bank reference model (use simpler flag + source_problem_id).
- Backfill of legacy submissions (document; create migration script only if data exists).
