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

## Verification checklist
- `go build ./...` passes
- `npx tsc --noEmit -p tsconfig.app.json` passes
- Manual testing recommended for: exam create→edit→delete flow, student exam taking, announcement notifications, question bank save/import
