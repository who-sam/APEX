# APEX Bug-Fix Plan

## Progress

### Phase A — Critical (app unusable) ✅
- [x] #17 — Compiler "unsupported language: python" — added aliases in judge0/client.go
- [x] #18 — Grading marks everything failed — output normalization, MCQ id trimming, written pending_review

### Phase B — Per-exam submission model ✅
- [x] ExamAttempt model + start/submit endpoints
- [x] Single notification per exam attempt
- [x] Dashboard + Results read attempts not submissions
- [x] ExamTaking calls single submitExamAttempt

### Phase C — Teacher backend fixes ✅
- [x] #1 — Delete exam FK — transaction with cascading child deletes
- [x] #2 — Fake exams — audited, no change needed
- [x] #3 — Always "upcoming" — computeExamStatus added to GetExams
- [x] #4 — View submissions — TeacherResults filter fixed for exam_classes
- [x] #5 — Pending grading queue — GET /teacher/grading/pending endpoint
- [x] #6 — Remove student from class — DELETE /classes/:id/members/:userId

### Phase D — Teacher UI/logic ✅
- [x] #7 — "View Grades" → "View Submission" (e008ee3)
- [x] #8 — Edit exam hydration via useExam + bankProblemToQuestion (c9058f2)
- [x] #9 — MCQ option parsing hardened (b2cb7ff)
- [x] #10 — Closes-at date/time picker in ExamBuilder (d2931b2)
- [x] #11 — IsBank flag on Problem + GetAllProblems scoped to bank (d1c05d2)
- [x] #12 — Save to Bank button → POST /problems/bank (d1c05d2)
- [x] #13 — SKIPPED per plan
- [x] #14 — Draft exam: IsDraft bool, Published toggle, student queries exclude (9330ad0)
- [x] #15 — Danger zone spacing: mt-12 (fc852ba)
- [x] #16 — Recent activity per-exam: verified working via Phase B

### Phase E — Student UI/logic ✅
- [x] #19 — Announcement notifications: fan-out on create (b66b24a)
- [x] #20 — Exam tap routing: active/upcoming → take, completed → review (5792c8f)
- [x] #21 — Remove difficulty badges from student pages (fbca907)
- [x] #22 — "Prepare" → "Start Exam" (92a06ff)
- [x] #23 — "Continue" vs "Start" based on active attempt (33242ed)
- [x] #24 — Results per-exam: verified working via Phase B (useMyAttempts)
- [x] #25 — One notification per exam: verified grader guards ExamAttemptID

---

## All phases complete.

---

## Phase F — Destructive exam edits reset attempts (Option B)

Problem: Teacher replace-all save / testcase edit / MCQ answer change cascades
submission/testcase deletes but orphans ExamAttempt rows. Student sees exam
as "completed" with no submissions and cannot re-enter. localStorage session
also stale.

### Backend
- [x] models.Exam: add ResetAt *time.Time
- [x] migrations.go: ALTER TABLE exams ADD COLUMN reset_at TIMESTAMPTZ
- [x] exam/reset.go: ResetExamAttempts(tx, examID)
      - delete TestResults (via submission ids), Submissions, ExamAttempts for exam
      - set exams.reset_at = now
      - notify each enrolled student
- [x] wire reset into:
      - problem.DeleteProblem
      - problem.UpdateProblem (when correct_option_ids changed)
      - testcase.AddTestCase / UpdateTestCase (if expected_output changed) / DeleteTestCase

### Frontend
- [x] ExamBuilder: confirm dialog if attempt_count > 0 on edit
- [x] ExamTaking: wipe localStorage session if session.startedAt < exam.reset_at
- [x] exam.ts types: reset_at?: string

### Commits
1. backend model + migration
2. backend ResetExamAttempts helper + handler wiring
3. frontend ExamBuilder confirm
4. frontend ExamTaking session invalidation

### Verify
- `go build ./...` clean
- `./node_modules/.bin/tsc --noEmit` clean
- Manual: edit testcase on active exam with attempts → notifications + student re-entry works

## Teacher feedback + score override (2026-04-24)
- Migration: `submissions.teacher_feedback TEXT` (idempotent, pre-AutoMigrate).
- Model: `Submission.TeacherFeedback` field.
- Handler `PUT /submissions/:id/grade`: accepts optional `teacher_feedback` (pointer; nil skips write). Existing `judge0.FinalizeAttempt` call recomputes attempt score on override.
- Frontend: `gradeSubmission` payload carries `teacher_feedback`; GradeWritten seeds local draft from `currentSub.teacher_feedback` so overrides retain prior value; Submit button no longer gated on `pending_review`.
- ExamReview: feedback callout renders only when `gradesAnnounced && sub.teacher_feedback`.

## Verification checklist
- `go build ./...` passes
- `npx tsc --noEmit -p tsconfig.app.json` passes
- Manual testing recommended for: exam create→edit→delete flow, student exam taking, announcement notifications, question bank save/import
