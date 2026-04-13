Here's the full audit of every mock data source and the backend endpoints needed to make this project fully functional:
🗄️ Database Tables Needed
Table	Purpose
users / profiles	User identity (name, email, student ID, photo, role)
courses	Course info (name, code, cover image, teacher_id)
course_enrollments	Student ↔ Course membership
exams	Exam metadata (title, description, duration, schedule, course_id, status)
questions	Question bank (type, text, points, tags, course_id, and type-specific JSON)
exam_questions	Junction: which questions belong to which exam (with ordering)
student_answers	Per-question answers during exam taking
exam_submissions	Submission record (student_id, exam_id, started_at, submitted_at, score)
grades	Per-student per-exam grade (score, total, graded_by, announced)
announcements	Course announcements (course_id, title, body, created_at)
notifications	User notifications (type, title, description, read, link)
messages	Chat messages between users
teams / classmates	Class member listing
achievements	User achievements/badges
leaderboard (view)	Aggregated ranking from grades
🔌 Endpoints / Queries Needed (grouped by feature)
1. Auth & Users

    POST /auth/signup — Register with role selection
    POST /auth/login — Email/password login
    POST /auth/google — Google OAuth
    GET /profiles/:id — Fetch profile
    PATCH /profiles/:id — Update name, photo, student ID

2. Courses

    GET /courses — List courses (filtered by role: teacher's courses vs enrolled)
    POST /courses — Create course (teacher)
    PATCH /courses/:id — Edit course name/photo
    DELETE /courses/:id — Delete course
    POST /courses/enroll — Student joins via course code
    POST /courses/:id/enroll-csv — Bulk enroll via CSV
    GET /courses/:id — Course detail (members, exams, announcements, grades)
    GET /courses/:id/students — Student list for a course
    DELETE /courses/:id/students/:studentId — Remove student

3. Exams

    GET /exams?course_id= — List exams (upcoming/active/completed)
    POST /exams — Create exam (from builder)
    PATCH /exams/:id — Update exam
    DELETE /exams/:id — Delete exam
    GET /exams/:id — Full exam with questions (for taking/preview)
    POST /exams/:id/start — Start attempt, return submission ID
    POST /exams/:id/submit — Submit answers
    POST /exams/:id/auto-save — Save partial answers

4. Question Bank

    GET /questions?course_id=&tags= — List/filter questions
    POST /questions — Create question
    PATCH /questions/:id — Update question
    DELETE /questions/:id — Delete question(s)

5. Grading & Results

    GET /exams/:id/submissions — All submissions for an exam (teacher)
    GET /submissions/:id — Single submission detail
    PATCH /submissions/:id/grade — Grade written/coding questions
    POST /courses/:id/announce-grades — Mark grades as announced
    GET /results?student_id= — Student's results across exams
    GET /results?exam_id= — Per-exam results (teacher view)

6. Dashboard

    GET /dashboard/student — Active exam, upcoming exams, recent activity, course progress
    GET /dashboard/teacher — Stats (total students, active exams, classes), active exams, grade distribution

7. Leaderboard

    GET /leaderboard?course_id= — Rankings by score

8. Notifications

    GET /notifications — User's notifications
    PATCH /notifications/:id/read — Mark as read
    PATCH /notifications/read-all — Mark all read

9. Messages

    GET /messages — Conversations list
    GET /messages/:conversationId — Message thread
    POST /messages — Send message

10. Team / Classmates

    GET /courses/:id/members — Class members

11. Announcements

    GET /courses/:id/announcements — List announcements
    POST /courses/:id/announcements — Create announcement

12. Practice

    GET /practice/questions — Practice questions (could reuse question bank)

13. Code Execution (Edge Function)

    POST /execute-code — Run student code against test cases (sandboxed)

📊 Summary
Category	Mock Data Files	Tables	Endpoints
Auth/Users	3	2	5
Courses	2	2	8
Exams	5	3	8
Questions	1	1	4
Grading/Results	4	2	6
Dashboard	3	— (views)	2
Social (notif/msg/team)	3	3	7
Leaderboard	1	1 (view)	1
Code Execution	1	—	1
Total	~23 files	~14 tables	~42 endpoints
