// Command seed loads a rich, demo-ready dataset into APEX for the defense walkthrough.
//
// It creates one supervisor-named teacher, a cohort of students (one "main"
// account meant to be driven live on camera), four classes, a spread of exams
// in every lifecycle state (graded / upcoming / live-now / draft), realistic
// result distributions, a pending manual-grading queue, a reusable question
// bank with folders, class announcements, and notifications.
//
// Every status literal and score below is computed to match the live grader
// (internal/judge0/grader.go) exactly, so the seeded snapshot is indistinguishable
// from data produced by the real submit/grade flow.
//
// Usage:
//
//	go run ./cmd/seed            # seed once; exits early if demo data already present
//	go run ./cmd/seed -reset     # wipe existing @apex.test demo data first, then reseed
//
// The reset is scoped to the @apex.test domain and never touches real accounts.
package main

import (
	"apex/internal/config"
	"apex/internal/database"
	"apex/internal/models"
	"crypto/rand"
	"flag"
	"fmt"
	"log"
	"math"
	"math/big"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	demoPassword    = "demo1234"
	teacherEmail    = "ayman.omera@apex.test"
	teacherName     = "Prof. Dr. Ayman El-Sayed Omera"
	mainStudentMail = "amr.samy@apex.test"
	inviteCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
)

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

func hashPwd(s string) string {
	h, err := bcrypt.GenerateFromPassword([]byte(s), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("bcrypt: %v", err)
	}
	return string(h)
}

func inviteCode() string {
	code := make([]byte, 8)
	for i := range code {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(inviteCodeChars))))
		code[i] = inviteCodeChars[n.Int64()]
	}
	return string(code)
}

func ptrTime(t time.Time) *time.Time { return &t }
func ptrUint(u uint) *uint           { return &u }

// effPoints mirrors the grader's "points<=0 -> 10" fallback.
func effPoints(p int) float64 {
	if p <= 0 {
		return 10
	}
	return float64(p)
}

func mustCreate(tx *gorm.DB, v any) {
	if err := tx.Create(v).Error; err != nil {
		log.Fatalf("create: %v", err)
	}
}

// jsonb columns reject empty string; supply default JSON for non-MCQ problems
// and non-MCQ submissions.
func defaultProblemJSON(p *models.Problem) {
	if p.Options == "" {
		p.Options = "[]"
	}
	if p.CorrectOptionIDs == "" {
		p.CorrectOptionIDs = "[]"
	}
	if p.Tags == "" {
		p.Tags = "[]"
	}
}

func defaultSubmissionJSON(s *models.Submission) {
	if s.SelectedOptions == "" {
		s.SelectedOptions = "[]"
	}
}

func createProblem(tx *gorm.DB, p *models.Problem) {
	defaultProblemJSON(p)
	mustCreate(tx, p)
}

func createSubmission(tx *gorm.DB, s *models.Submission) {
	defaultSubmissionJSON(s)
	mustCreate(tx, s)
}

// setCreated backdates a row's created_at so timelines look organic.
func setCreated(tx *gorm.DB, model any, t time.Time) {
	if err := tx.Model(model).Update("created_at", t).Error; err != nil {
		log.Fatalf("set created_at: %v", err)
	}
}

func createUser(tx *gorm.DB, email, name, role string) models.User {
	u := models.User{
		Email:        email,
		PasswordHash: hashPwd(demoPassword),
		Role:         role,
		Name:         name,
	}
	mustCreate(tx, &u)
	mustCreate(tx, &models.UserProfile{
		UserID:              u.ID,
		NotifyEmail:         true,
		NotifyPush:          true,
		NotifyExamReminders: true,
	})
	return u
}

// ---------------------------------------------------------------------------
// Class / exam / problem builders
// ---------------------------------------------------------------------------

func enroll(tx *gorm.DB, classID uint, sts []models.User) {
	for _, s := range sts {
		mustCreate(tx, &models.ClassMember{ClassID: classID, UserID: s.ID})
	}
}

func createExam(tx *gorm.DB, teacherID uint, title, desc string, duration int, start, end *time.Time, draft bool) *models.Exam {
	e := &models.Exam{
		TeacherID:        teacherID,
		Title:            title,
		Description:      desc,
		DurationMinutes:  duration,
		StartTime:        start,
		EndTime:          end,
		ShowResultsAfter: true,
		PassingScore:     50,
		IsDraft:          draft,
	}
	mustCreate(tx, e)
	return e
}

func assignExam(tx *gorm.DB, examID, classID uint) {
	mustCreate(tx, &models.ExamClass{ExamID: examID, ClassID: classID})
}

func codingProblem(tx *gorm.DB, examID *uint, teacherID uint, order int, title, desc, starter string, points, timeMs int, diff string, tcs []models.TestCase) (*models.Problem, []models.TestCase) {
	p := &models.Problem{
		ExamID:        examID,
		TeacherID:     teacherID,
		Title:         title,
		Description:   desc,
		Type:          "coding",
		Points:        points,
		Difficulty:    diff,
		StarterCode:   starter,
		TimeLimitMs:   timeMs,
		MemoryLimitKb: 262144,
		OrderIndex:    order,
		Tags:          "[]",
	}
	createProblem(tx, p)
	out := make([]models.TestCase, 0, len(tcs))
	for i := range tcs {
		tc := tcs[i]
		tc.ProblemID = p.ID
		tc.OrderIndex = i
		mustCreate(tx, &tc)
		out = append(out, tc)
	}
	return p, out
}

func mcqProblem(tx *gorm.DB, examID *uint, teacherID uint, order int, title, desc, options, correct, explanation string, points int, diff string) *models.Problem {
	p := &models.Problem{
		ExamID:           examID,
		TeacherID:        teacherID,
		Title:            title,
		Description:      desc,
		Type:             "mcq",
		Points:           points,
		Difficulty:       diff,
		Options:          options,
		CorrectOptionIDs: correct,
		Explanation:      explanation,
		OrderIndex:       order,
		Tags:             "[]",
	}
	createProblem(tx, p)
	return p
}

func writtenProblem(tx *gorm.DB, examID *uint, teacherID uint, order int, title, desc, rubric string, maxWords, points int, diff string) *models.Problem {
	p := &models.Problem{
		ExamID:               examID,
		TeacherID:            teacherID,
		Title:                title,
		Description:          desc,
		Type:                 "written",
		Points:               points,
		Difficulty:           diff,
		Rubric:               rubric,
		MaxWordCount:         maxWords,
		RequireManualGrading: true,
		OrderIndex:           order,
		Tags:                 "[]",
	}
	createProblem(tx, p)
	return p
}

func bankProblem(tx *gorm.DB, teacherID uint, folderID *uint, ptype, title, desc string, points int, diff, options, correct, starter string) *models.Problem {
	p := &models.Problem{
		IsBank:           true,
		TeacherID:        teacherID,
		FolderID:         folderID,
		Title:            title,
		Description:      desc,
		Type:             ptype,
		Points:           points,
		Difficulty:       diff,
		Options:          options,
		CorrectOptionIDs: correct,
		StarterCode:      starter,
		TimeLimitMs:      2000,
		MemoryLimitKb:    262144,
		MaxWordCount:     500,
		Tags:             "[]",
	}
	if ptype == "written" {
		p.RequireManualGrading = true
	}
	createProblem(tx, p)
	return p
}

// bankCoding creates a reusable coding question in the bank, complete with
// starter code and test cases (stdin/stdout), so it is runnable/gradable the
// moment it is imported into an exam.
func bankCoding(tx *gorm.DB, teacherID uint, folderID *uint, title, desc, starter string, points int, diff string, tcs []models.TestCase) *models.Problem {
	p := &models.Problem{
		IsBank:        true,
		TeacherID:     teacherID,
		FolderID:      folderID,
		Title:         title,
		Description:   desc,
		Type:          "coding",
		Points:        points,
		Difficulty:    diff,
		StarterCode:   starter,
		TimeLimitMs:   2000,
		MemoryLimitKb: 262144,
		MaxWordCount:  500,
		Tags:          "[]",
	}
	createProblem(tx, p)
	for i := range tcs {
		tc := tcs[i]
		tc.ProblemID = p.ID
		tc.OrderIndex = i
		mustCreate(tx, &tc)
	}
	return p
}

// ---------------------------------------------------------------------------
// Attempt + submission builders (scores computed exactly like the live grader)
// ---------------------------------------------------------------------------

// contrib is one problem's contribution to an attempt's aggregate score.
type contrib struct {
	earned  float64 // points earned on this problem
	points  float64 // problem weight (excluded from denominator when pending)
	pending bool    // pending_review -> excluded from numerator AND denominator
}

func newAttempt(tx *gorm.DB, userID, examID uint, started, submitted time.Time) *models.ExamAttempt {
	att := &models.ExamAttempt{
		UserID:      userID,
		ExamID:      examID,
		Status:      "submitted",
		SubmittedAt: ptrTime(submitted),
	}
	mustCreate(tx, att)
	// autoCreateTime fills started_at on insert; override it to backdate.
	if err := tx.Model(att).Update("started_at", started).Error; err != nil {
		log.Fatalf("backdate attempt: %v", err)
	}
	return att
}

// finalizeAttempt writes Score and GradedNotified using the live aggregation rule:
// Score = Σ(earned over non-pending problems) / Σ(points over non-pending problems) * 100.
func finalizeAttempt(tx *gorm.DB, att *models.ExamAttempt, cs ...contrib) {
	numer, denom := 0.0, 0.0
	anyPending := false
	for _, c := range cs {
		if c.pending {
			anyPending = true
			continue
		}
		numer += c.earned
		denom += c.points
	}
	score := 0.0
	if denom > 0 {
		score = numer / denom * 100
	}
	updates := map[string]any{"score": math.Round(score*100) / 100}
	if !anyPending {
		updates["graded_notified"] = true
	}
	if err := tx.Model(att).Updates(updates).Error; err != nil {
		log.Fatalf("finalize attempt: %v", err)
	}
}

func codingSub(tx *gorm.DB, att *models.ExamAttempt, userID uint, lang string, p *models.Problem, tcs []models.TestCase, code string, passed int) contrib {
	total := len(tcs)
	score := 100.0
	status := "accepted"
	if total > 0 {
		score = float64(passed) / float64(total) * 100
		if passed < total {
			status = "wrong_answer"
		}
	}
	s := &models.Submission{
		UserID:          userID,
		ProblemID:       p.ID,
		ExamID:          att.ExamID,
		ExamAttemptID:   ptrUint(att.ID),
		Type:            "coding",
		Language:        lang,
		Code:            code,
		Status:          status,
		PassedCount:     passed,
		TotalCount:      total,
		Score:           score,
		ExecutionTimeMs: 38,
		MemoryKb:        14336,
	}
	createSubmission(tx, s)
	for i, tc := range tcs {
		pass := i < passed
		st := "accepted"
		actual := tc.ExpectedOutput
		if !pass {
			st = "wrong_answer"
			actual = "(incorrect output)"
		}
		mustCreate(tx, &models.TestResult{
			SubmissionID:    s.ID,
			TestCaseID:      tc.ID,
			Passed:          pass,
			Status:          st,
			ActualOutput:    actual,
			ExecutionTimeMs: 36,
			MemoryKb:        14336,
		})
	}
	pts := effPoints(p.Points)
	return contrib{earned: score / 100 * pts, points: pts}
}

func mcqSub(tx *gorm.DB, att *models.ExamAttempt, userID uint, p *models.Problem, selected string, correct bool) contrib {
	score := 0.0
	status := "wrong_answer"
	if correct {
		score = 100
		status = "accepted"
	}
	createSubmission(tx, &models.Submission{
		UserID:          userID,
		ProblemID:       p.ID,
		ExamID:          att.ExamID,
		ExamAttemptID:   ptrUint(att.ID),
		Type:            "mcq",
		SelectedOptions: selected,
		Status:          status,
		Score:           score,
	})
	pts := effPoints(p.Points)
	return contrib{earned: score / 100 * pts, points: pts}
}

func writtenSub(tx *gorm.DB, att *models.ExamAttempt, userID uint, p *models.Problem, text string, graded bool, score float64, feedback string) contrib {
	status := "pending_review"
	fb := ""
	sc := 0.0
	if graded {
		status = "accepted"
		fb = feedback
		sc = score
	}
	createSubmission(tx, &models.Submission{
		UserID:          userID,
		ProblemID:       p.ID,
		ExamID:          att.ExamID,
		ExamAttemptID:   ptrUint(att.ID),
		Type:            "written",
		TextAnswer:      text,
		Status:          status,
		TeacherFeedback: fb,
		Score:           sc,
	})
	if !graded {
		return contrib{pending: true}
	}
	pts := effPoints(p.Points)
	return contrib{earned: sc / 100 * pts, points: pts}
}

func notify(tx *gorm.DB, userID uint, ntype, title, desc, link string, read bool, created time.Time) {
	n := &models.Notification{
		UserID:      userID,
		Type:        ntype,
		Title:       title,
		Description: desc,
		LinkTo:      link,
		Read:        read,
	}
	mustCreate(tx, n)
	setCreated(tx, n, created)
}

// ---------------------------------------------------------------------------
// Attempt row shapes (one per exam question layout)
// ---------------------------------------------------------------------------

type cmwRow struct { // coding + mcq + written
	st      models.User
	code    string
	passed  int
	mcqSel  string
	mcqOK   bool
	wText   string
	wGraded bool
	wScore  float64
	wFB     string
}

type cmRow struct { // coding + mcq
	st     models.User
	code   string
	passed int
	mcqSel string
	mcqOK  bool
}

type mwRow struct { // mcq + written
	st      models.User
	mcqSel  string
	mcqOK   bool
	wText   string
	wGraded bool
	wScore  float64
	wFB     string
}

func buildCMW(tx *gorm.DB, exam *models.Exam, lang string, pc, pm, pw *models.Problem, tcs []models.TestCase, rows []cmwRow) {
	start := *exam.StartTime
	for i, r := range rows {
		sub := start.Add(time.Duration(58+i*3) * time.Minute)
		att := newAttempt(tx, r.st.ID, exam.ID, start, sub)
		c1 := codingSub(tx, att, r.st.ID, lang, pc, tcs, r.code, r.passed)
		c2 := mcqSub(tx, att, r.st.ID, pm, r.mcqSel, r.mcqOK)
		c3 := writtenSub(tx, att, r.st.ID, pw, r.wText, r.wGraded, r.wScore, r.wFB)
		finalizeAttempt(tx, att, c1, c2, c3)
	}
}

func buildCM(tx *gorm.DB, exam *models.Exam, lang string, pc, pm *models.Problem, tcs []models.TestCase, rows []cmRow) {
	start := *exam.StartTime
	for i, r := range rows {
		sub := start.Add(time.Duration(40+i*3) * time.Minute)
		att := newAttempt(tx, r.st.ID, exam.ID, start, sub)
		c1 := codingSub(tx, att, r.st.ID, lang, pc, tcs, r.code, r.passed)
		c2 := mcqSub(tx, att, r.st.ID, pm, r.mcqSel, r.mcqOK)
		finalizeAttempt(tx, att, c1, c2)
	}
}

func buildMW(tx *gorm.DB, exam *models.Exam, pm, pw *models.Problem, rows []mwRow) {
	start := *exam.StartTime
	for i, r := range rows {
		sub := start.Add(time.Duration(25+i*3) * time.Minute)
		att := newAttempt(tx, r.st.ID, exam.ID, start, sub)
		c1 := mcqSub(tx, att, r.st.ID, pm, r.mcqSel, r.mcqOK)
		c2 := writtenSub(tx, att, r.st.ID, pw, r.wText, r.wGraded, r.wScore, r.wFB)
		finalizeAttempt(tx, att, c1, c2)
	}
}

// ---------------------------------------------------------------------------
// Reset (scoped to @apex.test — never touches real accounts)
// ---------------------------------------------------------------------------

func resetDemoData(db *gorm.DB) {
	const anchor = "SELECT id FROM users WHERE email LIKE '%@apex.test'"
	// FK-safe order: children before parents.
	stmts := []string{
		`DELETE FROM test_results WHERE submission_id IN (SELECT id FROM submissions WHERE user_id IN (` + anchor + `))`,
		`DELETE FROM submissions WHERE user_id IN (` + anchor + `)
		   OR problem_id IN (SELECT id FROM problems WHERE teacher_id IN (` + anchor + `))
		   OR exam_id IN (SELECT id FROM exams WHERE teacher_id IN (` + anchor + `))`,
		`DELETE FROM test_cases WHERE problem_id IN (SELECT id FROM problems WHERE teacher_id IN (` + anchor + `))`,
		`DELETE FROM exam_attempts WHERE user_id IN (` + anchor + `)
		   OR exam_id IN (SELECT id FROM exams WHERE teacher_id IN (` + anchor + `))`,
		`DELETE FROM exam_classes WHERE exam_id IN (SELECT id FROM exams WHERE teacher_id IN (` + anchor + `))
		   OR class_id IN (SELECT id FROM classes WHERE teacher_id IN (` + anchor + `))`,
		`DELETE FROM problems WHERE teacher_id IN (` + anchor + `)
		   OR exam_id IN (SELECT id FROM exams WHERE teacher_id IN (` + anchor + `))`,
		`DELETE FROM class_members WHERE user_id IN (` + anchor + `)
		   OR class_id IN (SELECT id FROM classes WHERE teacher_id IN (` + anchor + `))`,
		`DELETE FROM exams WHERE teacher_id IN (` + anchor + `)`,
		`DELETE FROM announcements WHERE teacher_id IN (` + anchor + `)
		   OR class_id IN (SELECT id FROM classes WHERE teacher_id IN (` + anchor + `))`,
		`DELETE FROM folders WHERE teacher_id IN (` + anchor + `)`,
		`DELETE FROM classes WHERE teacher_id IN (` + anchor + `)`,
		`DELETE FROM notifications WHERE user_id IN (` + anchor + `)`,
		`DELETE FROM password_reset_tokens WHERE user_id IN (` + anchor + `)`,
		`DELETE FROM user_profiles WHERE user_id IN (` + anchor + `)`,
		`DELETE FROM users WHERE email LIKE '%@apex.test'`,
	}
	tx := db.Begin()
	for _, s := range stmts {
		if err := tx.Exec(s).Error; err != nil {
			tx.Rollback()
			log.Fatalf("reset failed: %v\nstatement: %s", err, s)
		}
	}
	if err := tx.Commit().Error; err != nil {
		log.Fatalf("reset commit: %v", err)
	}
	log.Println("previous @apex.test demo data wiped")
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

func main() {
	reset := flag.Bool("reset", false, "wipe existing @apex.test demo data before seeding")
	flag.Parse()
	if os.Getenv("SEED_RESET") == "1" || os.Getenv("SEED_RESET") == "true" {
		*reset = true
	}

	cfg := config.Load()
	database.Connect(cfg)
	db := database.DB

	if *reset {
		resetDemoData(db)
	}

	var existing models.User
	if err := db.Where("email = ?", teacherEmail).First(&existing).Error; err == nil {
		log.Println("demo data already present (run with -reset to rebuild), exiting")
		return
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	now := time.Now()

	// ==================================================================
	// Users
	// ==================================================================
	teacher := createUser(tx, teacherEmail, teacherName, "teacher")

	studentSpecs := []struct{ email, name string }{
		{mainStudentMail, "Amr Samy"},                // 0 — MAIN account (driven live on camera)
		{"omar.hassan@apex.test", "Omar Hassan"},     // 1
		{"lina.farouk@apex.test", "Lina Farouk"},     // 2
		{"youssef.kamal@apex.test", "Youssef Kamal"}, // 3
		{"mariam.adel@apex.test", "Mariam Adel"},     // 4
		{"ziad.tarek@apex.test", "Ziad Tarek"},       // 5
		{"nour.khaled@apex.test", "Nour Khaled"},     // 6
		{"hana.mostafa@apex.test", "Hana Mostafa"},   // 7
	}
	students := make([]models.User, 0, len(studentSpecs))
	for _, s := range studentSpecs {
		students = append(students, createUser(tx, s.email, s.name, "student"))
	}
	amr := students[0]

	// Give the main account a fuller profile for the settings/profile screen.
	if err := tx.Model(&models.UserProfile{}).Where("user_id = ?", amr.ID).
		Update("bio", "Senior ECE student at Menoufia University. Interested in embedded systems and web development.").Error; err != nil {
		log.Fatalf("update bio: %v", err)
	}

	// ==================================================================
	// Classes (grades announced so past results are released to students)
	// ==================================================================
	cs101 := &models.Class{TeacherID: teacher.ID, Name: "CS101 — Introduction to Programming", Section: "Section A", InviteCode: "CS101DEM", PassingThreshold: 60, GradesAnnounced: true, CoverImage: coverCS101}
	cs210 := &models.Class{TeacherID: teacher.ID, Name: "CS210 — Data Structures & Algorithms", Section: "Section B", InviteCode: "CS210DEM", PassingThreshold: 60, GradesAnnounced: true, CoverImage: coverCS210}
	cs330 := &models.Class{TeacherID: teacher.ID, Name: "CS330 — Database Systems", Section: "Section A", InviteCode: "CS330DEM", PassingThreshold: 60, GradesAnnounced: true, CoverImage: coverCS330}
	ece240 := &models.Class{TeacherID: teacher.ID, Name: "ECE240 — Embedded C Programming", Section: "Section A", InviteCode: "ECE240DM", PassingThreshold: 60, GradesAnnounced: true, CoverImage: coverECE240}
	for _, c := range []*models.Class{cs101, cs210, cs330, ece240} {
		mustCreate(tx, c)
	}

	// Rosters. Amr (0) is in CS101, CS210, CS330 — three courses — but NOT ECE240.
	enroll(tx, cs101.ID, students) // all 8
	enroll(tx, cs210.ID, []models.User{students[0], students[1], students[2], students[3], students[6], students[7]})
	enroll(tx, cs330.ID, []models.User{students[0], students[1], students[4], students[5], students[6]})
	enroll(tx, ece240.ID, []models.User{students[1], students[2], students[3], students[4], students[5], students[7]})

	// ==================================================================
	// Question bank + folders (reusable templates for the teacher)
	// ==================================================================
	fPy := &models.Folder{TeacherID: teacher.ID, Name: "Python Basics"}
	fDS := &models.Folder{TeacherID: teacher.ID, Name: "Data Structures"}
	fDB := &models.Folder{TeacherID: teacher.ID, Name: "Databases"}
	fEmb := &models.Folder{TeacherID: teacher.ID, Name: "Embedded C"}
	for _, f := range []*models.Folder{fPy, fDS, fDB, fEmb} {
		mustCreate(tx, f)
	}

	bankCoding(tx, teacher.ID, ptrUint(fPy.ID), "FizzBuzz",
		"Read an integer N, then print the numbers 1..N one per line — but print \"Fizz\" for multiples of 3, \"Buzz\" for multiples of 5, and \"FizzBuzz\" for multiples of both.",
		"n = int(input())\nfor i in range(1, n + 1):\n    # print Fizz, Buzz, FizzBuzz, or the number\n    pass\n", 10, "easy",
		[]models.TestCase{
			{Input: "5", ExpectedOutput: "1\n2\nFizz\n4\nBuzz", IsSample: true, Points: 0},
			{Input: "15", ExpectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", Points: 5},
			{Input: "3", ExpectedOutput: "1\n2\nFizz", Points: 5},
		})
	bankProblem(tx, teacher.ID, ptrUint(fPy.ID), "mcq", "Python truthiness", "Which of the following evaluates to False in a boolean context?", 5, "easy", `[{"id":"a","text":"[]"},{"id":"b","text":"\"0\""},{"id":"c","text":"1"},{"id":"d","text":"\"False\""}]`, `["a"]`, "")
	bankProblem(tx, teacher.ID, ptrUint(fPy.ID), "written", "Explain *args and **kwargs", "Explain what *args and **kwargs mean in a Python function signature, with a short example.", 10, "medium", "", "", "")
	bankCoding(tx, teacher.ID, ptrUint(fDS.ID), "Detect a cycle in a linked list",
		"A linked list of N nodes (0-indexed) is given by a 'next' array where next[i] is the index node i points to, or -1 for null. Starting from node 0, print \"true\" if you ever revisit a node (a cycle), otherwise \"false\".\n\nInput: line 1 is N; line 2 is the space-separated next[] array.",
		"n = int(input())\nnxt = list(map(int, input().split()))\n# follow next[] from node 0; print 'true' if a cycle exists, else 'false'\n", 15, "medium",
		[]models.TestCase{
			{Input: "3\n1 2 -1", ExpectedOutput: "false", IsSample: true, Points: 0},
			{Input: "3\n1 2 0", ExpectedOutput: "true", Points: 5},
			{Input: "4\n1 2 3 1", ExpectedOutput: "true", Points: 5},
			{Input: "1\n-1", ExpectedOutput: "false", Points: 5},
		})
	bankProblem(tx, teacher.ID, ptrUint(fDS.ID), "mcq", "FIFO structure", "Which data structure follows First-In-First-Out (FIFO) ordering?", 5, "easy", `[{"id":"a","text":"Stack"},{"id":"b","text":"Queue"},{"id":"c","text":"Binary tree"},{"id":"d","text":"Heap"}]`, `["b"]`, "")
	bankProblem(tx, teacher.ID, ptrUint(fDB.ID), "written", "Top-3 salaries per department", "Write an SQL query that returns the three highest salaries within each department.", 15, "hard", "", "", "")
	bankProblem(tx, teacher.ID, ptrUint(fDB.ID), "mcq", "Transitive dependencies", "Which normal form removes transitive dependencies?", 5, "medium", `[{"id":"a","text":"1NF"},{"id":"b","text":"2NF"},{"id":"c","text":"3NF"},{"id":"d","text":"BCNF"}]`, `["c"]`, "")
	bankCoding(tx, teacher.ID, ptrUint(fEmb.ID), "Toggle a register bit",
		"Read an unsigned 8-bit register value and toggle bit 3 (mask 0x08) using a bitmask, then print the resulting value.",
		"#include <stdio.h>\nint main(void) {\n    unsigned int reg;\n    scanf(\"%u\", &reg);\n    // toggle bit 3 (mask 0x08) and print the result\n    return 0;\n}\n", 10, "medium",
		[]models.TestCase{
			{Input: "0", ExpectedOutput: "8", IsSample: true, Points: 0},
			{Input: "8", ExpectedOutput: "0", Points: 4},
			{Input: "255", ExpectedOutput: "247", Points: 3},
			{Input: "5", ExpectedOutput: "13", Points: 3},
		})
	// Unassigned bank questions (no folder) populate the "Ungrouped" section.
	bankCoding(tx, teacher.ID, nil, "Two Sum",
		"The first line is the target integer; the second line is a space-separated array. Print the two 0-based indices (ascending, space-separated) of the elements that sum to the target. Exactly one solution exists.",
		"target = int(input())\nnums = list(map(int, input().split()))\n# print the two 0-based indices whose values sum to target\n", 10, "easy",
		[]models.TestCase{
			{Input: "9\n2 7 11 15", ExpectedOutput: "0 1", IsSample: true, Points: 0},
			{Input: "6\n3 2 4", ExpectedOutput: "1 2", Points: 5},
			{Input: "6\n3 3", ExpectedOutput: "0 1", Points: 5},
		})
	bankProblem(tx, teacher.ID, nil, "mcq", "Hash map lookup", "What is the average-case time complexity of a hash map lookup?", 5, "easy", `[{"id":"a","text":"O(1)"},{"id":"b","text":"O(log n)"},{"id":"c","text":"O(n)"},{"id":"d","text":"O(n log n)"}]`, `["a"]`, "")

	// ==================================================================
	// Exam A — CS101 Midterm (past, fully in play: graded + pending queue)
	// ==================================================================
	a1Start := now.Add(-7 * 24 * time.Hour)
	a1End := a1Start.Add(90 * time.Minute)
	cs101mid := createExam(tx, teacher.ID, "Midterm — Variables & Loops", "Covers variables, conditionals, loops, and basic functions.", 90, ptrTime(a1Start), ptrTime(a1End), false)
	assignExam(tx, cs101mid.ID, cs101.ID)

	m1c, m1tcs := codingProblem(tx, ptrUint(cs101mid.ID), teacher.ID, 0,
		"Sum of Two Numbers", "Read two space-separated integers from stdin and print their sum.",
		"a, b = map(int, input().split())\n# print their sum\n", 10, 2000, "easy",
		[]models.TestCase{
			{Input: "1 2", ExpectedOutput: "3", IsSample: true, Points: 0},
			{Input: "5 7", ExpectedOutput: "12", Points: 5},
			{Input: "-3 3", ExpectedOutput: "0", Points: 5},
		})
	m1m := mcqProblem(tx, ptrUint(cs101mid.ID), teacher.ID, 1,
		"Declaring a function", "Which keyword declares a function in Python?",
		`[{"id":"a","text":"func"},{"id":"b","text":"def"},{"id":"c","text":"function"},{"id":"d","text":"lambda"}]`, `["b"]`,
		"`def` introduces a function definition in Python.", 5, "easy")
	m1w := writtenProblem(tx, ptrUint(cs101mid.ID), teacher.ID, 2,
		"Lists vs Tuples", "Explain the key differences between a Python list and a tuple, and give one use case for each.",
		"Mutability (5 pts), syntax (2 pts), use cases (3 pts).", 200, 10, "medium")

	goodSum := "a, b = map(int, input().split())\nprint(a + b)\n"
	badSum := "a, b = map(int, input().split())\nprint(a - b)\n"
	buildCMW(tx, cs101mid, "python", m1c, m1m, m1w, m1tcs, []cmwRow{
		{st: students[0], code: goodSum, passed: 3, mcqSel: `["b"]`, mcqOK: true,
			wText:   "A list is mutable — you can append, remove, and reassign elements — and is written with []. A tuple is immutable and written with (); once created it can't change. Use a list for a growing collection of items; use a tuple for a fixed record, or as a dictionary key.",
			wGraded: true, wScore: 85, wFB: "Strong answer — you nailed mutability and the tuple-as-dict-key use case. A note on memory/perf would earn full marks. 85/100."},
		{st: students[1], code: goodSum, passed: 3, mcqSel: `["b"]`, mcqOK: true,
			wText:   "Lists can be changed after creation, tuples cannot. Lists use square brackets, tuples use parentheses. Lists for collections that change, tuples for fixed data.",
			wGraded: true, wScore: 80, wFB: "Correct and concise. Add a concrete use case to go further. 80/100."},
		{st: students[6], code: goodSum, passed: 3, mcqSel: `["c"]`, mcqOK: false,
			wText:   "A tuple is immutable and a list is mutable. Tuples are faster and safer for constants.",
			wGraded: true, wScore: 70, wFB: "Good on mutability; the MCQ tripped you up. 70/100."},
		{st: students[7], code: "a, b = map(int, input().split())\nprint(a + b)  # only handles the sample\n", passed: 1, mcqSel: `["b"]`, mcqOK: true,
			wText:   "Lists are mutable sequences with []. Tuples are immutable sequences with (). Use lists when the data changes and tuples for fixed groupings like coordinates.",
			wGraded: true, wScore: 90, wFB: "Excellent written answer. Revisit your loop logic for the coding question. 90/100."},
		// Written answers still awaiting manual grade -> pending queue for the demo.
		{st: students[2], code: goodSum, passed: 3, mcqSel: `["a"]`, mcqOK: false,
			wText: "List can be changed but tuple cannot. They use different brackets."},
		{st: students[3], code: "a, b = map(int, input().split())\nprint(a + b if a > 0 else 0)\n", passed: 2, mcqSel: `["b"]`, mcqOK: true,
			wText: "Tuples are immutable so they're safer for shared data; lists are mutable and used for collections that change over time."},
		{st: students[4], code: badSum, passed: 0, mcqSel: `["a"]`, mcqOK: false,
			wText: "Lists and tuples both store data."},
		// students[5] (Ziad) did not attempt -> shows as a missed exam.
	})

	// ==================================================================
	// Exam B — CS101 Quiz 1 (upcoming, published) -> "starts in 2 days"
	// ==================================================================
	b1Start := now.Add(2 * 24 * time.Hour)
	b1End := b1Start.Add(30 * time.Minute)
	cs101quiz := createExam(tx, teacher.ID, "Quiz 1 — Lists & Dicts", "Short quiz on Python lists and dictionaries.", 30, ptrTime(b1Start), ptrTime(b1End), false)
	assignExam(tx, cs101quiz.ID, cs101.ID)
	codingProblem(tx, ptrUint(cs101quiz.ID), teacher.ID, 0,
		"Sum a List", "Read a line of space-separated integers and print their sum.",
		"nums = list(map(int, input().split()))\n# print the sum\n", 10, 2000, "easy",
		[]models.TestCase{
			{Input: "1 2 3", ExpectedOutput: "6", IsSample: true, Points: 0},
			{Input: "10 20 30 40", ExpectedOutput: "100", Points: 10},
		})
	mcqProblem(tx, ptrUint(cs101quiz.ID), teacher.ID, 1,
		"Dict lookup complexity", "What is the average-case time complexity of a Python dict lookup?",
		`[{"id":"a","text":"O(1)"},{"id":"b","text":"O(log n)"},{"id":"c","text":"O(n)"},{"id":"d","text":"O(n log n)"}]`, `["a"]`,
		"Hash tables give O(1) average-case lookup.", 5, "easy")

	// ==================================================================
	// Exam C — CS101 Lab Practice (LIVE NOW) -> Amr takes it on camera.
	// No attempts seeded so the "Start Exam" flow is clean for everyone.
	// ==================================================================
	c1Start := now.Add(-5 * time.Minute)
	c1End := now.Add(55 * time.Minute)
	cs101lab := createExam(tx, teacher.ID, "Lab Practice — Strings", "Live in-lab practice on string manipulation. Open now.", 60, ptrTime(c1Start), ptrTime(c1End), false)
	assignExam(tx, cs101lab.ID, cs101.ID)
	codingProblem(tx, ptrUint(cs101lab.ID), teacher.ID, 0,
		"Reverse a String", "Read a single line of text and print it reversed.",
		"s = input()\n# print s reversed\n", 10, 2000, "easy",
		[]models.TestCase{
			{Input: "hello", ExpectedOutput: "olleh", IsSample: true, Points: 0},
			{Input: "APEX", ExpectedOutput: "XEPA", Points: 5},
			{Input: "racecar", ExpectedOutput: "racecar", Points: 5},
		})
	mcqProblem(tx, ptrUint(cs101lab.ID), teacher.ID, 1,
		"Slice step -1", "In Python, what does `s[::-1]` produce?",
		`[{"id":"a","text":"The string unchanged"},{"id":"b","text":"The string reversed"},{"id":"c","text":"Only the first character"},{"id":"d","text":"A syntax error"}]`, `["b"]`,
		"A slice with step -1 walks the sequence backwards, reversing it.", 5, "easy")

	// ==================================================================
	// Exam D — CS210 Midterm (past, graded)
	// ==================================================================
	d1Start := now.Add(-10 * 24 * time.Hour)
	d1End := d1Start.Add(90 * time.Minute)
	cs210mid := createExam(tx, teacher.ID, "Midterm — Complexity & Recursion", "Big-O analysis, recursion, and iterative equivalents.", 90, ptrTime(d1Start), ptrTime(d1End), false)
	assignExam(tx, cs210mid.ID, cs210.ID)

	d1c, d1tcs := codingProblem(tx, ptrUint(cs210mid.ID), teacher.ID, 0,
		"Nth Fibonacci", "Read an integer n and print the nth Fibonacci number, where F(1)=1 and F(2)=1.",
		"n = int(input())\n# print the nth Fibonacci number\n", 15, 2000, "medium",
		[]models.TestCase{
			{Input: "7", ExpectedOutput: "13", IsSample: true, Points: 0},
			{Input: "10", ExpectedOutput: "55", Points: 8},
			{Input: "1", ExpectedOutput: "1", Points: 7},
		})
	d1m := mcqProblem(tx, ptrUint(cs210mid.ID), teacher.ID, 1,
		"Binary search complexity", "What is the worst-case time complexity of binary search on a sorted array?",
		`[{"id":"a","text":"O(n)"},{"id":"b","text":"O(log n)"},{"id":"c","text":"O(1)"},{"id":"d","text":"O(n log n)"}]`, `["b"]`,
		"Each step halves the search space -> O(log n).", 5, "easy")
	d1w := writtenProblem(tx, ptrUint(cs210mid.ID), teacher.ID, 2,
		"Recursion vs Iteration", "Compare recursion and iteration in terms of readability, memory, and performance. When would you prefer each?",
		"Call-stack cost (4 pts), readability (3 pts), when-to-use (3 pts).", 250, 10, "medium")

	goodFib := "n = int(input())\na, b = 0, 1\nfor _ in range(n):\n    a, b = b, a + b\nprint(a)\n"
	buildCMW(tx, cs210mid, "python", d1c, d1m, d1w, d1tcs, []cmwRow{
		{st: students[0], code: goodFib, passed: 3, mcqSel: `["b"]`, mcqOK: true,
			wText:   "Recursion mirrors the mathematical definition and reads cleanly for tree/divide-and-conquer problems, but every call adds a stack frame, so deep recursion risks O(n) extra memory and stack overflow. Iteration uses constant space and is usually faster because it avoids call overhead. I prefer recursion when the structure is naturally recursive (trees, backtracking) and iteration for linear passes and tight loops.",
			wGraded: true, wScore: 88, wFB: "Excellent — clear contrast of stack cost vs constant-space iteration, and a good tail-recursion instinct. 88/100."},
		{st: students[1], code: goodFib, passed: 3, mcqSel: `["b"]`, mcqOK: true,
			wText:   "Recursion is shorter to write but uses more memory because of the call stack. Iteration is faster and uses less memory. Use recursion for trees and iteration for simple loops.",
			wGraded: true, wScore: 75, wFB: "Correct points, a little thin on the performance reasoning. 75/100."},
		{st: students[2], code: "n = int(input())\na, b = 0, 1\nfor _ in range(n - 1):\n    a, b = b, a + b\nprint(b)\n", passed: 2, mcqSel: `["b"]`, mcqOK: true,
			wText:   "Recursion calls itself, iteration uses a loop. Recursion can be cleaner but slower and heavier on memory.",
			wGraded: true, wScore: 80, wFB: "Good. Watch the off-by-one in your Fibonacci base case. 80/100."},
		{st: students[6], code: "n = int(input())\nprint(n)\n", passed: 1, mcqSel: `["b"]`, mcqOK: true,
			wText:   "Recursion is a function calling itself. It's elegant but can be slow. Iteration repeats with a loop and is efficient.",
			wGraded: true, wScore: 60, wFB: "The written answer is fine; your code only handles the base case. 60/100."},
		// Youssef's written answer still pending -> appears in the grading queue.
		{st: students[3], code: goodFib, passed: 3, mcqSel: `["a"]`, mcqOK: false,
			wText: "Iteration is generally better for performance because there is no function-call overhead, while recursion can be more readable for problems that are defined recursively."},
		// students[7] (Hana) missed this exam.
	})

	// ==================================================================
	// Exam E — CS210 Final Project Assessment (DRAFT, unpublished)
	// ==================================================================
	cs210final := createExam(tx, teacher.ID, "Final Project Assessment", "Draft — final project rubric and coding challenge. Not yet published.", 120, nil, nil, true)
	assignExam(tx, cs210final.ID, cs210.ID)
	codingProblem(tx, ptrUint(cs210final.ID), teacher.ID, 0,
		"Binary Search", "Read a target and a sorted list; print the index of the target, or -1 if absent.",
		"target = int(input())\nnums = list(map(int, input().split()))\n# print index of target or -1\n", 20, 3000, "medium",
		[]models.TestCase{
			{Input: "3\n1 2 3 4 5", ExpectedOutput: "2", IsSample: true, Points: 0},
			{Input: "9\n1 2 3 4 5", ExpectedOutput: "-1", Points: 10},
		})

	// ==================================================================
	// Exam F — CS330 Quiz (past, graded; MCQ + written)
	// ==================================================================
	f1Start := now.Add(-4 * 24 * time.Hour)
	f1End := f1Start.Add(45 * time.Minute)
	cs330quiz := createExam(tx, teacher.ID, "Quiz — SQL Fundamentals", "Filtering, joins, and normalization basics.", 45, ptrTime(f1Start), ptrTime(f1End), false)
	assignExam(tx, cs330quiz.ID, cs330.ID)

	f1m := mcqProblem(tx, ptrUint(cs330quiz.ID), teacher.ID, 0,
		"Filtering rows", "Which SQL clause filters rows before grouping?",
		`[{"id":"a","text":"HAVING"},{"id":"b","text":"WHERE"},{"id":"c","text":"ORDER BY"},{"id":"d","text":"SELECT"}]`, `["b"]`,
		"WHERE filters rows before aggregation; HAVING filters groups after.", 5, "easy")
	f1w := writtenProblem(tx, ptrUint(cs330quiz.ID), teacher.ID, 1,
		"INNER JOIN vs LEFT JOIN", "Explain the difference between INNER JOIN and LEFT JOIN, and give an example where they return different results.",
		"Definition of each (5 pts), a divergent example (5 pts).", 250, 10, "medium")

	buildMW(tx, cs330quiz, f1m, f1w, []mwRow{
		{st: students[0], mcqSel: `["b"]`, mcqOK: true,
			wText:   "INNER JOIN returns only rows that match in both tables. LEFT JOIN returns every row from the left table plus matches from the right, filling the right-hand columns with NULL when there is no match. Example: customers LEFT JOIN orders lists customers who have never ordered (with NULL order columns), whereas INNER JOIN drops them entirely.",
			wGraded: true, wScore: 90, wFB: "Very clear, with a correct NULL-padding example. An ON-vs-WHERE note would make it perfect. 90/100."},
		{st: students[1], mcqSel: `["b"]`, mcqOK: true,
			wText:   "INNER JOIN keeps only matching rows in both tables. LEFT JOIN keeps all left rows and fills missing right values with NULL.",
			wGraded: true, wScore: 85, wFB: "Correct and clean. Add an example to reach full marks. 85/100."},
		{st: students[4], mcqSel: `["a"]`, mcqOK: false,
			wText:   "INNER JOIN joins tables. LEFT JOIN also joins but keeps the left side.",
			wGraded: true, wScore: 70, wFB: "Right idea, but too brief and the MCQ was HAVING vs WHERE. 70/100."},
		// Ziad's written answer is still pending -> grading queue.
		{st: students[5], mcqSel: `["c"]`, mcqOK: false,
			wText: "A LEFT JOIN returns more rows than an INNER JOIN when the right table has missing matches."},
		// students[6] (Nour) missed this exam.
	})

	// ==================================================================
	// Exam G — ECE240 Midterm (past, graded; coding + MCQ, no written)
	// Amr is not enrolled here — populates the teacher's cross-class view.
	// ==================================================================
	g1Start := now.Add(-6 * 24 * time.Hour)
	g1End := g1Start.Add(60 * time.Minute)
	ece240mid := createExam(tx, teacher.ID, "Midterm — Embedded C Basics", "Bit manipulation and the volatile qualifier.", 60, ptrTime(g1Start), ptrTime(g1End), false)
	assignExam(tx, ece240mid.ID, ece240.ID)

	g1c, g1tcs := codingProblem(tx, ptrUint(ece240mid.ID), teacher.ID, 0,
		"Count Set Bits", "Read an unsigned integer and print the number of 1-bits in its binary representation.",
		"#include <stdio.h>\nint main(void) {\n    unsigned int n;\n    scanf(\"%u\", &n);\n    // print the popcount of n\n    return 0;\n}\n", 10, 2000, "medium",
		[]models.TestCase{
			{Input: "5", ExpectedOutput: "2", IsSample: true, Points: 0},
			{Input: "7", ExpectedOutput: "3", Points: 5},
			{Input: "8", ExpectedOutput: "1", Points: 5},
		})
	g1m := mcqProblem(tx, ptrUint(ece240mid.ID), teacher.ID, 1,
		"The volatile qualifier", "Which qualifier tells the compiler a variable may change outside normal program flow (e.g. a memory-mapped I/O register)?",
		`[{"id":"a","text":"const"},{"id":"b","text":"static"},{"id":"c","text":"volatile"},{"id":"d","text":"register"}]`, `["c"]`,
		"`volatile` forces the compiler to re-read the value on every access.", 5, "easy")

	goodPop := "#include <stdio.h>\nint main(void){unsigned int n;scanf(\"%u\",&n);int c=0;while(n){c+=n&1;n>>=1;}printf(\"%d\\n\",c);return 0;}\n"
	buildCM(tx, ece240mid, "c", g1c, g1m, g1tcs, []cmRow{
		{st: students[1], code: goodPop, passed: 3, mcqSel: `["c"]`, mcqOK: true},
		{st: students[2], code: "#include <stdio.h>\nint main(void){unsigned int n;scanf(\"%u\",&n);int c=0;for(int i=0;i<3;i++)c+=(n>>i)&1;printf(\"%d\\n\",c);return 0;}\n", passed: 2, mcqSel: `["c"]`, mcqOK: true},
		{st: students[3], code: goodPop, passed: 3, mcqSel: `["a"]`, mcqOK: false},
		{st: students[4], code: "#include <stdio.h>\nint main(void){unsigned int n;scanf(\"%u\",&n);printf(\"%d\\n\",n&1);return 0;}\n", passed: 1, mcqSel: `["c"]`, mcqOK: true},
		{st: students[5], code: "#include <stdio.h>\nint main(void){printf(\"0\\n\");return 0;}\n", passed: 0, mcqSel: `["d"]`, mcqOK: false},
		{st: students[7], code: goodPop, passed: 3, mcqSel: `["c"]`, mcqOK: true},
	})

	// ==================================================================
	// Announcements (visible to enrolled members)
	// ==================================================================
	type annSpec struct {
		class *models.Class
		title string
		body  string
		ago   time.Duration
	}
	anns := []annSpec{
		{cs101, "Welcome to CS101 \U0001F44B", "Welcome everyone! Office hours are Sundays 1–3pm in Lab 2. Please install Python 3 before our first session.", 14 * 24 * time.Hour},
		{cs101, "Midterm grades are out", "The Variables & Loops midterm has been graded and released. Check your Results page. Regrade requests are open for 48 hours.", 24 * time.Hour},
		{cs210, "Recursion lab this week", "This week's lab covers recursion and the call stack. Pre-reading is posted under Resources — please skim it beforehand.", 3 * 24 * time.Hour},
		{cs330, "Guest lecture: Query Optimization", "Thursday 2pm, Hall B — a guest lecture on indexing and query plans. Attendance counts toward the participation bonus.", 2 * 24 * time.Hour},
		{ece240, "Lab kits available", "GPIO lab kits can be collected from Room 204. One kit per student; please return them by the end of term.", 5 * 24 * time.Hour},
	}
	for _, a := range anns {
		ann := &models.Announcement{ClassID: a.class.ID, TeacherID: teacher.ID, Title: a.title, Body: a.body, Attachments: "[]"}
		mustCreate(tx, ann)
		setCreated(tx, ann, now.Add(-a.ago))
	}

	// ==================================================================
	// Notifications — a lit bell for the main account (Amr)
	// ==================================================================
	reviewLink := func(examID uint) string { return fmt.Sprintf("/dashboard/exam/%d/review", examID) }
	notify(tx, amr.ID, "result", "Exam Graded", "Your submission for “Midterm — Variables & Loops” has been graded. Score: 94%.", reviewLink(cs101mid.ID), false, now.Add(-24*time.Hour))
	notify(tx, amr.ID, "result", "Exam Graded", "Your submission for “Midterm — Complexity & Recursion” has been graded. Score: 96%.", reviewLink(cs210mid.ID), false, now.Add(-3*24*time.Hour))
	notify(tx, amr.ID, "result", "Exam Graded", "Your submission for “Quiz — SQL Fundamentals” has been graded. Score: 93%.", reviewLink(cs330quiz.ID), false, now.Add(-30*time.Hour))
	notify(tx, amr.ID, "announcement", "CS101 — Midterm grades are out", "The Variables & Loops midterm has been graded and released.", fmt.Sprintf("/dashboard/courses/%d?tab=announcements", cs101.ID), false, now.Add(-23*time.Hour))
	notify(tx, amr.ID, "exam_reminder", "Upcoming exam", "“Quiz 1 — Lists & Dicts” starts in 2 days. Get ready!", "/dashboard/exams", false, now.Add(-6*time.Hour))
	notify(tx, amr.ID, "submission", "Submission received", "We received your submission for “Midterm — Variables & Loops” and it is being graded.", reviewLink(cs101mid.ID), true, now.Add(-7*24*time.Hour))

	// One notification per other student so their bells aren't empty either.
	for _, s := range students[1:] {
		notify(tx, s.ID, "result", "Exam Graded", "One of your exams has been graded — check your Results page.", "/dashboard/results", false, now.Add(-2*24*time.Hour))
	}

	if err := tx.Commit().Error; err != nil {
		log.Fatalf("commit: %v", err)
	}

	// ==================================================================
	// Summary
	// ==================================================================
	loginURL := os.Getenv("APP_URL")
	if loginURL == "" {
		loginURL = "http://localhost:5173"
	}
	fmt.Println()
	fmt.Println("============================================================")
	fmt.Println("APEX demo data seeded.")
	fmt.Println("Login URL: " + loginURL)
	fmt.Println("Re-run any time with:  go run ./cmd/seed -reset")
	fmt.Println()
	fmt.Println("Teacher:")
	fmt.Printf("  %-26s  /  %s   (%s)\n", teacherEmail, demoPassword, teacherName)
	fmt.Println()
	fmt.Println("MAIN student (drive this one on camera):")
	fmt.Printf("  %-26s  /  %s   (Amr Samy)\n", mainStudentMail, demoPassword)
	fmt.Println("    • Enrolled in CS101, CS210, CS330")
	fmt.Println("    • Graded results w/ teacher notes: CS101 Midterm 94%, CS210 Midterm 96%, CS330 Quiz 93%")
	fmt.Println("    • Upcoming (locked): Quiz 1 — Lists & Dicts (starts in 2 days)")
	fmt.Println("    • LIVE NOW to take on camera: \"Lab Practice — Strings\" (CS101)")
	fmt.Println("    • 5 unread notifications + class announcements")
	fmt.Println()
	fmt.Printf("Other students (password: %s):\n", demoPassword)
	fmt.Println("  omar.hassan@apex.test     Omar Hassan     - top scorer across classes")
	fmt.Println("  lina.farouk@apex.test     Lina Farouk     - CS101 written pending grade")
	fmt.Println("  youssef.kamal@apex.test   Youssef Kamal   - CS210 written pending grade")
	fmt.Println("  mariam.adel@apex.test     Mariam Adel     - low scores, failed CS101 midterm")
	fmt.Println("  ziad.tarek@apex.test      Ziad Tarek      - CS330 written pending; missed CS101 midterm")
	fmt.Println("  nour.khaled@apex.test     Nour Khaled     - mid-range scorer")
	fmt.Println("  hana.mostafa@apex.test    Hana Mostafa    - strong scorer; missed CS210 midterm")
	fmt.Println()
	fmt.Println("Teacher pending-grading queue: 3 CS101 + 1 CS210 + 1 CS330 written answers.")
	fmt.Println()
	fmt.Println("Class invite codes:")
	fmt.Printf("  %-38s %s\n", cs101.Name, cs101.InviteCode)
	fmt.Printf("  %-38s %s\n", cs210.Name, cs210.InviteCode)
	fmt.Printf("  %-38s %s\n", cs330.Name, cs330.InviteCode)
	fmt.Printf("  %-38s %s\n", ece240.Name, ece240.InviteCode)
	fmt.Println("============================================================")
}
