import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, ArrowLeft, Clock, FileText, Megaphone, Trophy,
  Users, Copy, Check, Upload, Plus, Search, MoreHorizontal,
  Trash2, Eye, Download, Send, BarChart3, Pencil, Lock, AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

/* ── Mock data ── */
const courseImages: Record<string, string> = {
  "APX-CS101": "https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=800&h=300&fit=crop",
  "APX-CS201": "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=300&fit=crop",
  "APX-CS301": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=300&fit=crop",
  "APX-CS401": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=300&fit=crop",
  "APX-CS501": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=300&fit=crop",
  "APX-CS601": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=300&fit=crop",
};

const courseData: Record<string, { name: string; teacher: string; id: string }> = {
  "APX-CS101": { name: "CS101 — Intro to Programming", teacher: "Dr. Smith", id: "APX-CS101" },
  "APX-CS201": { name: "CS201 — Data Structures", teacher: "Prof. Johnson", id: "APX-CS201" },
  "APX-CS301": { name: "CS301 — Algorithms", teacher: "Dr. Williams", id: "APX-CS301" },
  "APX-CS401": { name: "CS401 — Machine Learning", teacher: "Dr. Adams", id: "APX-CS401" },
  "APX-CS501": { name: "CS501 — Operating Systems", teacher: "Prof. Chen", id: "APX-CS501" },
  "APX-CS601": { name: "CS601 — Computer Networks", teacher: "Dr. Patel", id: "APX-CS601" },
};

/* Per-course grades data for students */
const courseGradesMap: Record<string, { exam: string; score: number; total: number; date: string }[]> = {
  // Normal grades (default)
  default: [
    { exam: "Quiz 3 — Linked Lists", score: 85, total: 100, date: "Mar 20, 2026" },
    { exam: "Quiz 2 — Stacks & Queues", score: 92, total: 100, date: "Mar 10, 2026" },
    { exam: "Quiz 1 — Arrays", score: 78, total: 100, date: "Feb 28, 2026" },
  ],
  // CS401 — Grades NOT announced (empty state)
  "APX-CS401": [],
  // CS501 — Failed course (avg < 60%)
  "APX-CS501": [
    { exam: "Midterm — OS Concepts", score: 42, total: 100, date: "Mar 15, 2026" },
    { exam: "Quiz 2 — Scheduling", score: 55, total: 100, date: "Mar 05, 2026" },
    { exam: "Quiz 1 — Processes", score: 48, total: 100, date: "Feb 20, 2026" },
  ],
  // CS601 — Full marks (confetti!)
  "APX-CS601": [
    { exam: "Quiz 3 — TCP/IP", score: 100, total: 100, date: "Mar 20, 2026" },
    { exam: "Quiz 2 — Routing", score: 98, total: 100, date: "Mar 10, 2026" },
    { exam: "Quiz 1 — OSI Model", score: 100, total: 100, date: "Feb 28, 2026" },
  ],
};

// Per-course passing threshold (set by teacher)
const passingThresholdMap: Record<string, number> = {
  "APX-CS501": 50,  // OS course fails at 50%
};
const getPassingThreshold = (courseId: string) => passingThresholdMap[courseId] ?? 60;

// Whether grades are announced per course
const gradesAnnouncedMap: Record<string, boolean> = {
  "APX-CS401": false, // not announced
};

const getCourseGrades = (courseId: string) => courseGradesMap[courseId] ?? courseGradesMap.default;
const isGradesAnnounced = (courseId: string) => gradesAnnouncedMap[courseId] ?? true;

const courseExamsMap: Record<string, typeof defaultCourseExams> = {};
const defaultCourseExams = [
  { id: "mid-ds", name: "Midterm Exam", date: "Mar 28, 2026", duration: "90 min", status: "upcoming" as const, score: null },
  { id: "quiz-3", name: "Quiz 3 — Linked Lists", date: "Mar 20, 2026", duration: "30 min", status: "completed" as const, score: 85 },
  { id: "quiz-2", name: "Quiz 2 — Stacks & Queues", date: "Mar 10, 2026", duration: "30 min", status: "completed" as const, score: 92 },
  { id: "quiz-1", name: "Quiz 1 — Arrays", date: "Feb 28, 2026", duration: "30 min", status: "completed" as const, score: 78 },
];
const getCourseExams = (courseId: string) => courseExamsMap[courseId] ?? defaultCourseExams;

const courseAnnouncements = [
  { id: 1, title: "Midterm Exam Scheduled", body: "The midterm exam will be held on March 28th. It will cover all material from weeks 1–7.", date: "Mar 15, 2026" },
  { id: 2, title: "Office Hours Change", body: "Office hours this week will be moved to Thursday 3–5 PM instead of the usual Wednesday slot.", date: "Mar 12, 2026" },
  { id: 3, title: "Quiz 3 Results", body: "Quiz 3 results are now available. Class average was 81%. Great work everyone!", date: "Mar 21, 2026" },
];

const enrolledStudents = [
  { id: "S001", name: "Ahmed Salem", nationalId: "29901XXXXXX", avg: 85 },
  { id: "S002", name: "Maria Khan", nationalId: "30001XXXXXX", avg: 91 },
  { id: "S003", name: "Liam Park", nationalId: "29905XXXXXX", avg: 72 },
  { id: "S004", name: "Sara Reda", nationalId: "30003XXXXXX", avg: 88 },
  { id: "S005", name: "James Liu", nationalId: "29908XXXXXX", avg: 65 },
];

/* Grades spreadsheet mock data */
const gradesSpreadsheet = [
  { studentId: "S001", studentName: "Ahmed Salem", "Quiz 1 — Arrays": 82, "Quiz 2 — Stacks & Queues": 90, "Quiz 3 — Linked Lists": 85 },
  { studentId: "S002", studentName: "Maria Khan", "Quiz 1 — Arrays": 95, "Quiz 2 — Stacks & Queues": 88, "Quiz 3 — Linked Lists": 91 },
  { studentId: "S003", studentName: "Liam Park", "Quiz 1 — Arrays": 68, "Quiz 2 — Stacks & Queues": 72, "Quiz 3 — Linked Lists": 70 },
  { studentId: "S004", studentName: "Sara Reda", "Quiz 1 — Arrays": 90, "Quiz 2 — Stacks & Queues": 85, "Quiz 3 — Linked Lists": 88 },
  { studentId: "S005", studentName: "James Liu", "Quiz 1 — Arrays": 55, "Quiz 2 — Stacks & Queues": 62, "Quiz 3 — Linked Lists": 65 },
];

const examNames = ["Quiz 1 — Arrays", "Quiz 2 — Stacks & Queues", "Quiz 3 — Linked Lists"];

const statusColor = (s: string) => {
  if (s === "upcoming") return "bg-accent/15 text-accent border-accent/30";
  if (s === "completed") return "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
  return "bg-muted text-muted-foreground";
};

const gradeColor = (pct: number) => {
  if (pct >= 90) return "text-green-600 dark:text-green-400";
  if (pct >= 75) return "text-accent";
  if (pct >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-destructive";
};

/* ── Confetti helper ── */
function ConfettiBurst({ fire, firedRef }: { fire: boolean; firedRef: React.MutableRefObject<boolean> }) {
  useEffect(() => {
    if (fire && !firedRef.current) {
      firedRef.current = true;
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }, [fire, firedRef]);
  return null;
}

/* ================================================================
   STUDENT COURSE DETAIL
   ================================================================ */
function StudentCourseDetail({ course }: { course: { name: string; teacher: string; id: string } }) {
  const navigate = useNavigate();
  const confettiFired = useRef(false);

  const courseGrades = getCourseGrades(course.id);
  const studentGradesAnnounced = isGradesAnnounced(course.id);
  const courseExams = getCourseExams(course.id);

  const overallAvg = courseGrades.length
    ? Math.round(courseGrades.reduce((s, g) => s + (g.score / g.total) * 100, 0) / courseGrades.length)
    : 0;

  const hasFullMark = courseGrades.some((g) => g.score === g.total);

  return (
    <div className="space-y-6">
      {/* Cover image */}
      {courseImages[course.id] && (
        <div className="rounded-xl overflow-hidden h-40 sm:h-52">
          <img src={courseImages[course.id]} alt={course.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/courses")} className="mt-1 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {course.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Instructor: {course.teacher} • Course ID: <span className="font-mono">{course.id}</span>
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-muted-foreground">Overall Average</p>
          <p className={`text-2xl font-bold ${gradeColor(overallAvg)}`}>{overallAvg}%</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="exams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exams" className="gap-1.5">
            <FileText className="h-4 w-4" /> Exams
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-1.5">
            <Trophy className="h-4 w-4" /> Grades
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5">
            <Megaphone className="h-4 w-4" /> Announcements
          </TabsTrigger>
        </TabsList>

        {/* EXAMS TAB */}
        <TabsContent value="exams" className="space-y-3">
          {courseExams.map((exam) => (
            <Card
              key={exam.id}
              className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (exam.status === "upcoming") navigate(`/dashboard/exam/${exam.id}/take`);
                else navigate(`/dashboard/exam/${exam.id}/review`);
              }}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{exam.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.date}</span>
                    <span>•</span>
                    <span>{exam.duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {exam.score !== null && (
                    <span className={`text-lg font-bold ${gradeColor(exam.score)}`}>{exam.score}%</span>
                  )}
                  <Badge variant="outline" className={statusColor(exam.status)}>
                    {exam.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* GRADES TAB */}
        <TabsContent value="grades" className="space-y-4">
          {!studentGradesAnnounced ? (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Grades Not Yet Available</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Your instructor hasn't published grades for this course yet. Check back later.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Confetti trigger for full marks */}
              <ConfettiBurst fire={hasFullMark} firedRef={confettiFired} />

              {overallAvg < getPassingThreshold(course.id) && (
                <Alert variant="destructive" className="border-destructive/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Course At Risk</AlertTitle>
                  <AlertDescription>
                    Your current average ({overallAvg}%) is below the passing threshold of {getPassingThreshold(course.id)}%. Consider reviewing past material or reaching out to your instructor.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground">
                        <th className="px-5 py-3 text-left font-medium">Assessment</th>
                        <th className="px-3 py-3 text-left font-medium">Date</th>
                        <th className="px-3 py-3 text-right font-medium">Score</th>
                        <th className="px-3 py-3 text-right font-medium">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseGrades.map((g, i) => {
                        const pct = Math.round((g.score / g.total) * 100);
                        return (
                          <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3 font-medium text-foreground">{g.exam}</td>
                            <td className="px-3 py-3 text-muted-foreground">{g.date}</td>
                            <td className="px-3 py-3 text-right text-foreground">{g.score}/{g.total}</td>
                            <td className={`px-3 py-3 text-right font-bold ${gradeColor(pct)}`}>{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/80">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Assessments</p>
                    <p className="text-2xl font-bold text-foreground">{courseGrades.length}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/80">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Average</p>
                    <p className={`text-2xl font-bold ${gradeColor(overallAvg)}`}>{overallAvg}%</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/80">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Highest</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Math.max(...courseGrades.map((g) => Math.round((g.score / g.total) * 100)))}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ANNOUNCEMENTS TAB */}
        <TabsContent value="announcements" className="space-y-3">
          {courseAnnouncements.map((a) => (
            <Card key={a.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-foreground">{a.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">{a.date}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ================================================================
   TEACHER COURSE DETAIL
   ================================================================ */
function TeacherCourseDetail({ course }: { course: { name: string; teacher: string; id: string } }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState(false);
  const [students, setStudents] = useState(enrolledStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announcements, setAnnouncements] = useState(courseAnnouncements);
  const [gradesAnnounced, setGradesAnnounced] = useState(false);
  const [passingThreshold, setPassingThreshold] = useState(60);

  const copyId = () => {
    navigator.clipboard.writeText(course.id);
    setCopiedId(true);
    toast({ title: "Copied!", description: `Course ID ${course.id} copied to clipboard.` });
    setTimeout(() => setCopiedId(false), 2000);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Student removed" });
  };

  const postAnnouncement = () => {
    if (!announceTitle.trim()) return;
    setAnnouncements((prev) => [
      { id: Date.now(), title: announceTitle.trim(), body: announceBody.trim(), date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
      ...prev,
    ]);
    setAnnounceTitle("");
    setAnnounceBody("");
    setAnnounceOpen(false);
    toast({ title: "Announcement posted" });
  };

  const exportGradesCSV = () => {
    const headers = ["Student ID", "Student Name", ...examNames];
    const rows = gradesSpreadsheet.map((row) => [
      row.studentId,
      row.studentName,
      ...examNames.map((e) => String((row as Record<string, any>)[e] ?? "")),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.id}_grades.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: "Grades CSV downloaded." });
  };

  const announceGrades = () => {
    setAnnouncements((prev) => [
      {
        id: Date.now(),
        title: "Grades Published",
        body: "All current grades have been published and are now visible to students.",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
      ...prev,
    ]);
    setGradesAnnounced(true);
    toast({ title: "Grades announced!", description: "Students can now view their grades." });
  };

  return (
    <div className="space-y-6">
      {/* Cover image */}
      {courseImages[course.id] && (
        <div className="rounded-xl overflow-hidden h-40 sm:h-52">
          <img src={courseImages[course.id]} alt={course.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/courses")} className="mt-1 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {course.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="font-mono text-xs tracking-wider">{course.id}</Badge>
            <button
              onClick={copyId}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              {copiedId ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <span className="text-sm text-muted-foreground">• {students.length} students</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students" className="gap-1.5">
            <Users className="h-4 w-4" /> Students
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-1.5">
            <FileText className="h-4 w-4" /> Exams
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Grades
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5">
            <Megaphone className="h-4 w-4" /> Announcements
          </TabsTrigger>
        </TabsList>

        {/* STUDENTS TAB */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="outline" className="gap-1.5">
              <Upload className="h-4 w-4" /> Enroll via CSV
            </Button>
          </div>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="px-5 py-3 text-left font-medium">Student</th>
                    <th className="px-3 py-3 text-left font-medium">ID</th>
                    <th className="px-3 py-3 text-right font-medium">Average</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                              {s.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground font-mono text-xs">{s.id}</td>
                      <td className={`px-3 py-3 text-right font-bold ${gradeColor(s.avg)}`}>{s.avg}%</td>
                      <td className="px-3 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Grades</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => removeStudent(s.id)}>
                              <Trash2 className="h-4 w-4" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No students found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXAMS TAB */}
        <TabsContent value="exams" className="space-y-3">
          <div className="flex justify-end">
            <Button className="gap-1.5" onClick={() => navigate("/dashboard/exam-builder")}>
              <Plus className="h-4 w-4" /> Assign Exam
            </Button>
          </div>
          {defaultCourseExams.map((exam) => (
            <Card key={exam.id} className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{exam.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.date}</span>
                    <span>•</span>
                    <span>{exam.duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColor(exam.status)}>{exam.status}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => navigate("/dashboard/exam-builder", { state: { editExam: { id: exam.id, title: exam.name, duration: parseInt(exam.duration), status: exam.status } } })}>
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> Preview</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 min-w-[280px]">
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                Passing threshold:
              </p>
              <Slider
                value={[passingThreshold]}
                onValueChange={(val) => setPassingThreshold(val[0])}
                onValueCommit={(val) => toast({ title: "Threshold updated", description: `Passing grade set to ${val[0]}%` })}
                min={40}
                max={80}
                step={5}
                className="w-32"
              />
              <span className="text-sm font-medium min-w-[3ch] text-right">{passingThreshold}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportGradesCSV}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={announceGrades}
                disabled={gradesAnnounced}
              >
                <Send className="h-4 w-4" />
                {gradesAnnounced ? "Announced" : "Announce Grades"}
              </Button>
            </div>
          </div>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium sticky left-0 bg-card/90 backdrop-blur-sm z-10">Student</th>
                      <th className="px-3 py-3 text-left font-medium">ID</th>
                      {examNames.map((e) => (
                        <th key={e} className="px-3 py-3 text-center font-medium whitespace-nowrap">{e}</th>
                      ))}
                      <th className="px-3 py-3 text-center font-medium">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradesSpreadsheet.map((row) => {
                      const scores = examNames.map((e) => (row as Record<string, any>)[e] as number);
                      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                      const isFailing = avg < passingThreshold;
                      return (
                        <tr key={row.studentId} className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${isFailing ? "bg-destructive/5" : ""}`}>
                          <td className="px-4 py-3 font-medium text-foreground sticky left-0 bg-card/90 backdrop-blur-sm z-10">
                            <span className="flex items-center gap-2">
                              {row.studentName}
                              {isFailing && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground font-mono text-xs">{row.studentId}</td>
                          {scores.map((score, i) => (
                            <td key={i} className={`px-3 py-3 text-center font-semibold ${gradeColor(score)}`}>
                              {score}
                            </td>
                          ))}
                          <td className={`px-3 py-3 text-center font-bold ${isFailing ? "text-destructive" : gradeColor(avg)}`}>{avg}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Failing students summary */}
          {(() => {
            const failCount = gradesSpreadsheet.filter((row) => {
              const scores = examNames.map((e) => (row as Record<string, any>)[e] as number);
              return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) < passingThreshold;
            }).length;
            return failCount > 0 ? (
              <Alert variant="destructive" className="border-destructive/50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{failCount} student{failCount > 1 ? "s" : ""} below passing threshold</AlertTitle>
                <AlertDescription>
                  {failCount} out of {gradesSpreadsheet.length} students have an average below {passingThreshold}%.
                </AlertDescription>
              </Alert>
            ) : null;
          })()}
        </TabsContent>

        {/* ANNOUNCEMENTS TAB */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-1.5" onClick={() => setAnnounceOpen(true)}>
              <Plus className="h-4 w-4" /> Post Announcement
            </Button>
          </div>
          {announcements.map((a) => (
            <Card key={a.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-foreground">{a.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">{a.date}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Post Announcement Dialog */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Announcement</DialogTitle>
            <DialogDescription>This will be visible to all enrolled students.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="a-title">Title</Label>
              <Input id="a-title" placeholder="Announcement title" value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-body">Message</Label>
              <Textarea id="a-body" placeholder="Write your announcement..." rows={4} value={announceBody} onChange={(e) => setAnnounceBody(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnounceOpen(false)}>Cancel</Button>
            <Button onClick={postAnnouncement} disabled={!announceTitle.trim()}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================
   MAIN EXPORT
   ================================================================ */
export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useRole();
  const navigate = useNavigate();

  const course = id ? courseData[id] : null;

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground">Course not found</h2>
        <p className="text-sm text-muted-foreground mt-1">This course doesn't exist or you don't have access.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/courses")}>
          Back to Courses
        </Button>
      </div>
    );
  }

  return role === "teacher" ? <TeacherCourseDetail course={course} /> : <StudentCourseDetail course={course} />;
}
