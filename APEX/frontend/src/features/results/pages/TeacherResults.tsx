import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, Download, BarChart3, CheckCircle, XCircle, FileText, Eye, ArrowLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ── Mock data ── */
const mockCourses = [
  { id: "APX-CS101", name: "CS101 — Intro to Programming" },
  { id: "APX-CS201", name: "CS201 — Data Structures" },
  { id: "APX-CS301", name: "CS301 — Algorithms" },
];

const mockExamsByCourse: Record<string, { id: string; name: string; date: string; submissions: number; avgScore: number; passRate: number }[]> = {
  "APX-CS101": [
    { id: "1", name: "Midterm", date: "Feb 15, 2026", submissions: 45, avgScore: 74, passRate: 82 },
    { id: "2", name: "Quiz 2", date: "Feb 05, 2026", submissions: 45, avgScore: 81, passRate: 89 },
  ],
  "APX-CS201": [
    { id: "3", name: "Quiz 3 — Arrays", date: "Feb 10, 2026", submissions: 38, avgScore: 68, passRate: 71 },
    { id: "4", name: "Midterm", date: "Jan 20, 2026", submissions: 38, avgScore: 72, passRate: 77 },
  ],
  "APX-CS301": [
    { id: "5", name: "Assignment 1", date: "Jan 28, 2026", submissions: 30, avgScore: 72, passRate: 77 },
  ],
};

const mockStudentResults = [
  { id: "STU-001", name: "Ahmed Hassan", score: 92, total: 100, status: "passed", time: "45 min" },
  { id: "STU-002", name: "Sara Ali", score: 88, total: 100, status: "passed", time: "52 min" },
  { id: "STU-003", name: "Omar Khaled", score: 74, total: 100, status: "passed", time: "67 min" },
  { id: "STU-004", name: "Fatima Nour", score: 56, total: 100, status: "failed", time: "80 min" },
  { id: "STU-005", name: "Youssef Tarek", score: 45, total: 100, status: "failed", time: "90 min" },
  { id: "STU-006", name: "Mona Ibrahim", score: 91, total: 100, status: "passed", time: "38 min" },
  { id: "STU-007", name: "Karim Sayed", score: 83, total: 100, status: "passed", time: "55 min" },
  { id: "STU-008", name: "Nada Fouad", score: 67, total: 100, status: "passed", time: "72 min" },
];

const mockStudentAnswers: Record<string, { question: string; type: string; studentAnswer: string; correctAnswer: string; points: number; maxPoints: number }[]> = {
  "STU-001": [
    { question: "What is a linked list?", type: "Written", studentAnswer: "A linked list is a linear data structure where each element points to the next, allowing dynamic memory allocation and efficient insertions/deletions.", correctAnswer: "A data structure consisting of nodes where each node contains data and a reference to the next node.", points: 18, maxPoints: 20 },
    { question: "Which sorting algorithm has O(n log n) average case?", type: "MCQ", studentAnswer: "Merge Sort", correctAnswer: "Merge Sort", points: 10, maxPoints: 10 },
    { question: "Implement a stack using an array", type: "Coding", studentAnswer: "class Stack:\n  def __init__(self):\n    self.items = []\n  def push(self, item):\n    self.items.append(item)\n  def pop(self):\n    return self.items.pop()\n  def is_empty(self):\n    return len(self.items) == 0", correctAnswer: "N/A — graded by test cases", points: 24, maxPoints: 30 },
    { question: "Time complexity of binary search?", type: "MCQ", studentAnswer: "O(log n)", correctAnswer: "O(log n)", points: 10, maxPoints: 10 },
    { question: "Explain the difference between stack and queue", type: "Written", studentAnswer: "A stack follows LIFO (Last In First Out) — the last element added is the first removed. A queue follows FIFO (First In First Out) — the first element added is the first removed.", correctAnswer: "Stack = LIFO, Queue = FIFO", points: 20, maxPoints: 20 },
    { question: "Reverse a linked list", type: "Coding", studentAnswer: "def reverse(head):\n  prev = None\n  curr = head\n  while curr:\n    next_node = curr.next\n    curr.next = prev\n    prev = curr\n    curr = next_node\n  return prev", correctAnswer: "N/A — graded by test cases", points: 10, maxPoints: 10 },
  ],
  "STU-004": [
    { question: "What is a linked list?", type: "Written", studentAnswer: "It's a list that is linked together.", correctAnswer: "A data structure consisting of nodes where each node contains data and a reference to the next node.", points: 6, maxPoints: 20 },
    { question: "Which sorting algorithm has O(n log n) average case?", type: "MCQ", studentAnswer: "Bubble Sort", correctAnswer: "Merge Sort", points: 0, maxPoints: 10 },
    { question: "Implement a stack using an array", type: "Coding", studentAnswer: "class Stack:\n  def __init__(self):\n    self.items = []\n  def push(self, item):\n    self.items.append(item)", correctAnswer: "N/A — graded by test cases", points: 15, maxPoints: 30 },
    { question: "Time complexity of binary search?", type: "MCQ", studentAnswer: "O(log n)", correctAnswer: "O(log n)", points: 10, maxPoints: 10 },
    { question: "Explain the difference between stack and queue", type: "Written", studentAnswer: "They are both data structures.", correctAnswer: "Stack = LIFO, Queue = FIFO", points: 5, maxPoints: 20 },
    { question: "Reverse a linked list", type: "Coding", studentAnswer: "# I couldn't figure this out", correctAnswer: "N/A — graded by test cases", points: 0, maxPoints: 10 },
  ],
};

const questionPerformance = [
  { name: "Q1 (Written)", avgScore: 68 },
  { name: "Q2 (MCQ)", avgScore: 85 },
  { name: "Q3 (Code)", avgScore: 61 },
  { name: "Q4 (MCQ)", avgScore: 90 },
  { name: "Q5 (Written)", avgScore: 72 },
  { name: "Q6 (Code)", avgScore: 55 },
];

const testCaseResults = [
  { name: "TC 1", passRate: 95 },
  { name: "TC 2", passRate: 82 },
  { name: "TC 3", passRate: 68 },
  { name: "TC 4", passRate: 45 },
  { name: "TC 5", passRate: 38 },
];

export default function TeacherResults() {
  const { toast } = useToast();
  const location = useLocation();
  const routeState = location.state as { courseId?: string; examId?: string } | null;

  const [selectedCourse, setSelectedCourse] = useState<string>(routeState?.courseId || "");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [viewingStudent, setViewingStudent] = useState<string | null>(null);

  // When navigating with state, auto-select the first exam for that course
  useEffect(() => {
    if (routeState?.courseId && selectedCourse === routeState.courseId && !selectedExam) {
      const exams = mockExamsByCourse[routeState.courseId];
      if (exams?.length) {
        setSelectedExam(exams[0].id);
      }
    }
  }, [routeState, selectedCourse, selectedExam]);

  const examsForCourse = selectedCourse ? (mockExamsByCourse[selectedCourse] || []) : [];
  const exam = examsForCourse.find((e) => e.id === selectedExam);
  const passed = mockStudentResults.filter((s) => s.status === "passed").length;
  const failed = mockStudentResults.filter((s) => s.status === "failed").length;
  const classAvg = Math.round(mockStudentResults.reduce((a, s) => a + s.score, 0) / mockStudentResults.length);

  const studentForView = viewingStudent ? mockStudentResults.find((s) => s.id === viewingStudent) : null;
  const studentAnswers = viewingStudent ? (mockStudentAnswers[viewingStudent] || mockStudentAnswers["STU-001"]) : [];

  const handleExport = () => {
    if (!exam) return;
    const headers = "Student ID,Name,Score,Total,Status,Time\n";
    const rows = mockStudentResults.map((s) => `${s.id},${s.name},${s.score},${s.total},${s.status},${s.time}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exam.name.replace(/\s+/g, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Results downloaded as CSV." });
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedExam("");
  };

  // ── No course selected yet ──
  if (!selectedCourse) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Select a course to view exam results</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCourses.map((c) => (
            <Card
              key={c.id}
              className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => handleCourseChange(c.id)}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{c.id}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(mockExamsByCourse[c.id] || []).length} exam(s)
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Course selected but no exam ──
  if (!selectedExam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCourse("")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {mockCourses.find((c) => c.id === selectedCourse)?.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Select an exam to view results</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {examsForCourse.map((e) => (
            <Card
              key={e.id}
              className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setSelectedExam(e.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{e.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{e.date}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span>{e.submissions} submissions</span>
                  <span>Avg: {e.avgScore}%</span>
                  <span>Pass: {e.passRate}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Exam selected: full analytics ──
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedExam("")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{exam?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {mockCourses.find((c) => c.id === selectedCourse)?.name} • {exam?.date}
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Submissions</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{exam?.submissions}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Class Average</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{classAvg}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs">Passed</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{passed}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs">Failed</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Question Performance (Class Avg %)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Programming — Test Case Pass Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testCaseResults.map((tc) => (
                <div key={tc.name} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-12">{tc.name}</span>
                  <Progress value={tc.passRate} className="h-3 flex-1" />
                  <span className={`text-sm font-medium w-12 text-right ${tc.passRate >= 70 ? "text-green-500" : "text-destructive"}`}>
                    {tc.passRate}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student results table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Student Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStudentResults.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{s.score}/{s.total}</span>
                      <Progress value={s.score} className="h-1.5 w-16" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.status === "passed" ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
                      {s.status === "passed" ? "Passed" : "Failed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.time}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setViewingStudent(s.id)}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Individual student answer dialog */}
      <Dialog open={!!viewingStudent} onOpenChange={(open) => { if (!open) setViewingStudent(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{studentForView?.name}'s Answers</span>
              <Badge variant={studentForView?.status === "passed" ? "default" : "destructive"} className="ml-2">
                {studentForView?.score}/{studentForView?.total}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {studentAnswers.map((ans, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{ans.type}</Badge>
                      <span className="text-sm font-medium text-foreground">Q{i + 1}: {ans.question}</span>
                    </div>
                    <span className={`text-sm font-bold ${ans.points === ans.maxPoints ? "text-green-500" : ans.points === 0 ? "text-destructive" : "text-foreground"}`}>
                      {ans.points}/{ans.maxPoints}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Student's Answer</p>
                      {ans.type === "Coding" ? (
                        <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto font-mono text-foreground">{ans.studentAnswer}</pre>
                      ) : (
                        <p className={`text-sm rounded-md p-2 ${ans.studentAnswer === ans.correctAnswer ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-foreground"}`}>
                          {ans.studentAnswer}
                        </p>
                      )}
                    </div>

                    {ans.type !== "Coding" && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Correct Answer</p>
                        <p className="text-sm bg-green-500/10 rounded-md p-2 text-green-700 dark:text-green-400">{ans.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
