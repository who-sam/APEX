package main

import (
	"apex/internal/config"
	"apex/internal/database"
	"apex/internal/models"
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	demoPassword     = "demo1234"
	teacherEmail     = "demo.teacher@apex.test"
	inviteCodeChars  = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
)

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

func main() {
	cfg := config.Load()
	database.Connect(cfg)
	db := database.DB

	var existing models.User
	if err := db.Where("email = ?", teacherEmail).First(&existing).Error; err == nil {
		log.Println("demo data already present, exiting")
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

	// ------------------------------------------------------------------
	// Users
	// ------------------------------------------------------------------
	teacher := createUser(tx, teacherEmail, "Dr. Sara Ahmed", "teacher")

	studentSpecs := []struct{ email, name string }{
		{"omar.hassan@apex.test", "Omar Hassan"},
		{"lina.farouk@apex.test", "Lina Farouk"},
		{"youssef.kamal@apex.test", "Youssef Kamal"},
		{"mariam.adel@apex.test", "Mariam Adel"},
		{"ziad.tarek@apex.test", "Ziad Tarek"},
	}
	students := make([]models.User, 0, len(studentSpecs))
	for _, s := range studentSpecs {
		students = append(students, createUser(tx, s.email, s.name, "student"))
	}

	// ------------------------------------------------------------------
	// Classes
	// ------------------------------------------------------------------
	cs101 := models.Class{
		TeacherID:        teacher.ID,
		Name:             "CS101 — Intro to Programming",
		Section:          "Section A",
		InviteCode:       inviteCode(),
		PassingThreshold: 60,
	}
	mustCreate(tx, &cs101)

	cs210 := models.Class{
		TeacherID:        teacher.ID,
		Name:             "CS210 — Data Structures",
		Section:          "Section B",
		InviteCode:       inviteCode(),
		PassingThreshold: 60,
		GradesAnnounced:  true,
	}
	mustCreate(tx, &cs210)

	for _, st := range students {
		mustCreate(tx, &models.ClassMember{ClassID: cs101.ID, UserID: st.ID})
	}
	for _, st := range students[:3] {
		mustCreate(tx, &models.ClassMember{ClassID: cs210.ID, UserID: st.ID})
	}

	// ------------------------------------------------------------------
	// Exam (a) — Midterm (past, published)
	// ------------------------------------------------------------------
	midStart := now.Add(-7 * 24 * time.Hour)
	midEnd := midStart.Add(90 * time.Minute)
	midterm := models.Exam{
		TeacherID:        teacher.ID,
		Title:            "Midterm — Variables & Loops",
		Description:      "Covers variables, conditionals, loops, and basic functions.",
		DurationMinutes:  90,
		StartTime:        &midStart,
		EndTime:          &midEnd,
		ShowResultsAfter: true,
		PassingScore:     50,
		IsDraft:          false,
	}
	mustCreate(tx, &midterm)
	mustCreate(tx, &models.ExamClass{ExamID: midterm.ID, ClassID: cs101.ID})

	// P1 coding
	pCoding := models.Problem{
		ExamID:      ptrUint(midterm.ID),
		TeacherID:   teacher.ID,
		Title:       "Sum of Two Numbers",
		Description: "Implement `add(a, b)` returning the sum of two integers.",
		Type:        "coding",
		Points:      10,
		Difficulty:  "easy",
		StarterCode: "def add(a, b):\n    pass\n",
		TimeLimitMs: 2000,
		OrderIndex:  0,
		Tags:        "[]",
	}
	createProblem(tx, &pCoding)
	mustCreate(tx, &models.TestCase{ProblemID: pCoding.ID, Input: "1 2", ExpectedOutput: "3", IsSample: true, Points: 0, OrderIndex: 0})
	mustCreate(tx, &models.TestCase{ProblemID: pCoding.ID, Input: "5 7", ExpectedOutput: "12", Points: 5, OrderIndex: 1})
	mustCreate(tx, &models.TestCase{ProblemID: pCoding.ID, Input: "-3 3", ExpectedOutput: "0", Points: 5, OrderIndex: 2})

	// P2 mcq
	pMCQ := models.Problem{
		ExamID:           ptrUint(midterm.ID),
		TeacherID:        teacher.ID,
		Title:            "Which is a Python keyword?",
		Description:      "Pick the valid Python keyword used to declare functions.",
		Type:             "mcq",
		Points:           5,
		Difficulty:       "easy",
		Options:          `[{"id":"a","text":"function"},{"id":"b","text":"def"},{"id":"c","text":"lambda-keyword"},{"id":"d","text":"void"}]`,
		CorrectOptionIDs: `["b"]`,
		MultipleCorrect:  false,
		Explanation:      "`def` declares functions in Python.",
		OrderIndex:       1,
		Tags:             "[]",
	}
	createProblem(tx, &pMCQ)

	// P3 written
	pWritten := models.Problem{
		ExamID:               ptrUint(midterm.ID),
		TeacherID:            teacher.ID,
		Title:                "Lists vs Tuples",
		Description:          "Explain the difference between a list and a tuple in Python.",
		Type:                 "written",
		Points:               10,
		Difficulty:           "medium",
		MaxWordCount:         200,
		Rubric:               "Mentions mutability (5 pts), syntax (3 pts), use cases (2 pts).",
		RequireManualGrading: true,
		OrderIndex:           2,
		Tags:                 "[]",
	}
	createProblem(tx, &pWritten)

	// ------------------------------------------------------------------
	// Exam (b) — Quiz 1 (upcoming, published)
	// ------------------------------------------------------------------
	q1Start := now.Add(2 * 24 * time.Hour)
	q1End := q1Start.Add(30 * time.Minute)
	quiz1 := models.Exam{
		TeacherID:        teacher.ID,
		Title:            "Quiz 1 — Lists & Dicts",
		Description:      "Short quiz on Python lists and dictionaries.",
		DurationMinutes:  30,
		StartTime:        &q1Start,
		EndTime:          &q1End,
		ShowResultsAfter: true,
		PassingScore:     50,
	}
	mustCreate(tx, &quiz1)
	mustCreate(tx, &models.ExamClass{ExamID: quiz1.ID, ClassID: cs101.ID})

	q1Coding := models.Problem{
		ExamID:      ptrUint(quiz1.ID),
		TeacherID:   teacher.ID,
		Title:       "Reverse a List",
		Description: "Read a space-separated list of integers and print them reversed.",
		Type:        "coding",
		Points:      10,
		Difficulty:  "easy",
		StarterCode: "nums = list(map(int, input().split()))\n# print reversed\n",
		TimeLimitMs: 2000,
		OrderIndex:  0,
		Tags:        "[]",
	}
	createProblem(tx, &q1Coding)
	mustCreate(tx, &models.TestCase{ProblemID: q1Coding.ID, Input: "1 2 3", ExpectedOutput: "3 2 1", IsSample: true, Points: 0, OrderIndex: 0})
	mustCreate(tx, &models.TestCase{ProblemID: q1Coding.ID, Input: "9 8 7 6", ExpectedOutput: "6 7 8 9", Points: 10, OrderIndex: 1})

	q1MCQ := models.Problem{
		ExamID:           ptrUint(quiz1.ID),
		TeacherID:        teacher.ID,
		Title:            "Dict lookup time complexity?",
		Description:      "Average-case time complexity of a Python dict lookup.",
		Type:             "mcq",
		Points:           5,
		Difficulty:       "easy",
		Options:          `[{"id":"a","text":"O(1)"},{"id":"b","text":"O(log n)"},{"id":"c","text":"O(n)"},{"id":"d","text":"O(n log n)"}]`,
		CorrectOptionIDs: `["a"]`,
		Explanation:      "Hash tables provide O(1) average lookup.",
		OrderIndex:       1,
		Tags:             "[]",
	}
	createProblem(tx, &q1MCQ)

	// ------------------------------------------------------------------
	// Exam (c) — Final (draft)
	// ------------------------------------------------------------------
	final := models.Exam{
		TeacherID:       teacher.ID,
		Title:           "Final Exam (WIP)",
		Description:     "Final exam draft — not yet published.",
		DurationMinutes: 120,
		IsDraft:         true,
	}
	mustCreate(tx, &final)
	mustCreate(tx, &models.ExamClass{ExamID: final.ID, ClassID: cs210.ID})

	finalCoding := models.Problem{
		ExamID:      ptrUint(final.ID),
		TeacherID:   teacher.ID,
		Title:       "Binary Search",
		Description: "Implement iterative binary search on a sorted list.",
		Type:        "coding",
		Points:      20,
		Difficulty:  "medium",
		StarterCode: "def binary_search(arr, target):\n    pass\n",
		TimeLimitMs: 2000,
		OrderIndex:  0,
		Tags:        "[]",
	}
	createProblem(tx, &finalCoding)

	// ------------------------------------------------------------------
	// Attempts + submissions for the Midterm
	// ------------------------------------------------------------------
	type attemptSpec struct {
		student     models.User
		codingCode  string
		codingPass  int
		codingScore float64
		mcqPick     string
		mcqScore    float64
		writtenText string
		writtenDone bool
		writtenScore float64
		writtenFB   string
	}

	specs := []attemptSpec{
		{
			student: students[0], // Omar — top
			codingCode: "def add(a, b):\n    return a + b\n", codingPass: 3, codingScore: 10,
			mcqPick: `["b"]`, mcqScore: 5,
			writtenText: "Lists are mutable, can grow and shrink. Tuples are immutable, fixed-size. Lists use [] and tuples use (). Tuples are typically used for fixed records and as dict keys.",
			writtenDone: true, writtenScore: 8, writtenFB: "Good explanation, missed use cases nuance.",
		},
		{
			student: students[1], // Lina — pending review written
			codingCode: "def add(a, b):\n    return a + b\n", codingPass: 3, codingScore: 10,
			mcqPick: `["b"]`, mcqScore: 5,
			writtenText: "List can be changed but tuple cannot. Different brackets.",
			writtenDone: false,
		},
		{
			student: students[2], // Youssef — pending review written
			codingCode: "def add(a, b):\n    return a + b\n", codingPass: 3, codingScore: 10,
			mcqPick: `["b"]`, mcqScore: 5,
			writtenText: "Tuples are immutable so safer for shared data; lists are mutable and used for collections that change.",
			writtenDone: false,
		},
		{
			student: students[3], // Mariam — wrong code & wrong mcq
			codingCode: "def add(a, b):\n    return a - b\n", codingPass: 1, codingScore: 0,
			mcqPick: `["a"]`, mcqScore: 0,
			writtenText: "Lists and tuples store data.",
			writtenDone: false,
		},
		// students[4] (Ziad) — no attempt, leaves missed state
	}

	for _, s := range specs {
		total := s.codingScore + s.mcqScore
		if s.writtenDone {
			total += s.writtenScore
		}
		startedAt := midStart
		submittedAt := midStart.Add(75 * time.Minute)

		att := models.ExamAttempt{
			UserID:      s.student.ID,
			ExamID:      midterm.ID,
			SubmittedAt: ptrTime(submittedAt),
			Status:      "submitted",
			Score:       total,
		}
		mustCreate(tx, &att)
		// Override autoCreateTime so the attempt appears historical.
		if err := tx.Model(&att).Update("started_at", startedAt).Error; err != nil {
			log.Fatalf("update started_at: %v", err)
		}

		codingStatus := "completed"
		createSubmission(tx, &models.Submission{
			UserID:        s.student.ID,
			ProblemID:     pCoding.ID,
			ExamID:        midterm.ID,
			ExamAttemptID: ptrUint(att.ID),
			Type:          "coding",
			Language:      "python",
			Code:          s.codingCode,
			Status:        codingStatus,
			PassedCount:   s.codingPass,
			TotalCount:    3,
			Score:         s.codingScore,
		})

		createSubmission(tx, &models.Submission{
			UserID:          s.student.ID,
			ProblemID:       pMCQ.ID,
			ExamID:          midterm.ID,
			ExamAttemptID:   ptrUint(att.ID),
			Type:            "mcq",
			SelectedOptions: s.mcqPick,
			Status:          "completed",
			Score:           s.mcqScore,
		})

		writtenStatus := "pending_review"
		feedback := ""
		score := 0.0
		if s.writtenDone {
			writtenStatus = "completed"
			feedback = s.writtenFB
			score = s.writtenScore
		}
		createSubmission(tx, &models.Submission{
			UserID:          s.student.ID,
			ProblemID:       pWritten.ID,
			ExamID:          midterm.ID,
			ExamAttemptID:   ptrUint(att.ID),
			Type:            "written",
			TextAnswer:      s.writtenText,
			Status:          writtenStatus,
			TeacherFeedback: feedback,
			Score:           score,
		})
	}

	if err := tx.Commit().Error; err != nil {
		log.Fatalf("commit: %v", err)
	}

	fmt.Println()
	fmt.Println("============================================================")
	fmt.Println("APEX demo data seeded.")
	loginURL := os.Getenv("APP_URL")
	if loginURL == "" {
		loginURL = "http://localhost:5173"
	}
	fmt.Println("Login URL: " + loginURL)
	fmt.Println()
	fmt.Println("Teacher:")
	fmt.Printf("  %s  /  %s   (Dr. Sara Ahmed)\n", teacherEmail, demoPassword)
	fmt.Println()
	fmt.Printf("Students (password: %s):\n", demoPassword)
	fmt.Println("  omar.hassan@apex.test    (Omar Hassan)    - CS101, CS210, midterm 23/25")
	fmt.Println("  lina.farouk@apex.test    (Lina Farouk)    - CS101, CS210, midterm pending grade")
	fmt.Println("  youssef.kamal@apex.test  (Youssef Kamal)  - CS101, CS210, midterm pending grade")
	fmt.Println("  mariam.adel@apex.test    (Mariam Adel)    - CS101,        midterm 0/25 (failed)")
	fmt.Println("  ziad.tarek@apex.test     (Ziad Tarek)     - CS101,        no attempt yet")
	fmt.Println()
	fmt.Println("Class invite codes:")
	fmt.Printf("  CS101: %s\n", cs101.InviteCode)
	fmt.Printf("  CS210: %s\n", cs210.InviteCode)
	fmt.Println("============================================================")
}
