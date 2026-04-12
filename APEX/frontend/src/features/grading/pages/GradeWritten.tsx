import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  ArrowLeft, ChevronRight, ChevronLeft, CheckCircle, Clock, FileText,
  MessageSquare, Save, User, Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ── Mock data ── */
const mockCourses = [
  { id: "APX-CS101", name: "CS101 — Intro to Programming" },
  { id: "APX-CS201", name: "CS201 — Data Structures" },
  { id: "APX-CS301", name: "CS301 — Algorithms" },
];

const mockExams: Record<string, { id: string; name: string; pendingCount: number }[]> = {
  "APX-CS201": [
    { id: "ex-1", name: "Midterm — Data Structures", pendingCount: 5 },
    { id: "ex-2", name: "Quiz 3 — Arrays", pendingCount: 3 },
  ],
  "APX-CS301": [
    { id: "ex-3", name: "Assignment 1 — Graph Algorithms", pendingCount: 8 },
  ],
  "APX-CS101": [
    { id: "ex-4", name: "Midterm — Intro to Programming", pendingCount: 2 },
  ],
};

interface GradingQuestion {
  id: string;
  questionText: string;
  maxPoints: number;
  rubric: string;
  studentAnswer: string;
  awardedPoints: number | null;
  feedback: string;
}

interface WrittenSubmission {
  id: string;
  studentName: string;
  studentId: string;
  questions: GradingQuestion[];
  graded: boolean;
}

const mockSubmissions: WrittenSubmission[] = [
  {
    id: "sub-1", studentName: "Ahmed Hassan", studentId: "STU-001", graded: false,
    questions: [
      { id: "q1", questionText: "Explain the difference between a stack and a queue.", maxPoints: 20, rubric: "Must mention LIFO vs FIFO, provide examples, and discuss use cases.", studentAnswer: "A stack follows LIFO (Last In First Out) — the last element added is the first removed. Think of a stack of plates. A queue follows FIFO (First In First Out) — the first element added is the first removed. Like a line at a store.", awardedPoints: null, feedback: "" },
      { id: "q2", questionText: "What is a linked list and why would you use one over an array?", maxPoints: 20, rubric: "Should define linked list structure, mention dynamic memory, and compare insertion/deletion performance.", studentAnswer: "A linked list is a data structure where each element points to the next one. You'd use it over an array when you need to frequently insert or delete elements because these operations are O(1) in a linked list versus O(n) in an array.", awardedPoints: null, feedback: "" },
    ],
  },
  {
    id: "sub-2", studentName: "Sara Ali", studentId: "STU-002", graded: false,
    questions: [
      { id: "q1", questionText: "Explain the difference between a stack and a queue.", maxPoints: 20, rubric: "Must mention LIFO vs FIFO, provide examples, and discuss use cases.", studentAnswer: "Stacks and queues are both data structures. A stack is LIFO and a queue is FIFO.", awardedPoints: null, feedback: "" },
      { id: "q2", questionText: "What is a linked list and why would you use one over an array?", maxPoints: 20, rubric: "Should define linked list structure, mention dynamic memory, and compare insertion/deletion performance.", studentAnswer: "A linked list is where nodes are connected. Each node has data and a pointer. It's better than arrays for adding and removing items because you don't need to shift elements. However, arrays are better for random access since linked lists require traversal.", awardedPoints: null, feedback: "" },
    ],
  },
  {
    id: "sub-3", studentName: "Fatima Nour", studentId: "STU-004", graded: false,
    questions: [
      { id: "q1", questionText: "Explain the difference between a stack and a queue.", maxPoints: 20, rubric: "Must mention LIFO vs FIFO, provide examples, and discuss use cases.", studentAnswer: "They are both data structures used to store information.", awardedPoints: null, feedback: "" },
      { id: "q2", questionText: "What is a linked list and why would you use one over an array?", maxPoints: 20, rubric: "Should define linked list structure, mention dynamic memory, and compare insertion/deletion performance.", studentAnswer: "A linked list stores things in order.", awardedPoints: null, feedback: "" },
    ],
  },
  {
    id: "sub-4", studentName: "Omar Khaled", studentId: "STU-003", graded: true,
    questions: [
      { id: "q1", questionText: "Explain the difference between a stack and a queue.", maxPoints: 20, rubric: "Must mention LIFO vs FIFO, provide examples, and discuss use cases.", studentAnswer: "Stack = LIFO, Queue = FIFO. Stack example: undo button. Queue example: print jobs.", awardedPoints: 16, feedback: "Good understanding but could use more detail on use cases." },
      { id: "q2", questionText: "What is a linked list and why would you use one over an array?", maxPoints: 20, rubric: "Should define linked list structure, mention dynamic memory, and compare insertion/deletion performance.", studentAnswer: "A linked list is nodes pointing to next nodes. Better for insertion/deletion at O(1). Arrays are O(n) for these operations.", awardedPoints: 18, feedback: "Clear and concise." },
    ],
  },
];

type Step = "course" | "exam" | "grading";

export default function GradeWritten() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("course");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [submissions, setSubmissions] = useState<WrittenSubmission[]>(mockSubmissions);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [filter, setFilter] = useState<"all" | "pending" | "graded">("pending");

  const exams = selectedCourse ? (mockExams[selectedCourse] || []) : [];
  const pendingSubs = submissions.filter((s) => !s.graded);
  const gradedSubs = submissions.filter((s) => s.graded);
  const filteredSubs = filter === "all" ? submissions : filter === "pending" ? pendingSubs : gradedSubs;
  const currentSub = filteredSubs.find((s) => s.id === selectedStudentId) || filteredSubs[0];
  const currentQ = currentSub?.questions[currentQIdx];
  const totalQuestions = currentSub?.questions.length || 0;

  // Auto-select first student when entering grading
  useEffect(() => {
    if (step === "grading" && filteredSubs.length > 0 && !filteredSubs.find((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(filteredSubs[0].id);
      setCurrentQIdx(0);
    }
  }, [step, filteredSubs, selectedStudentId]);

  const updateGrade = useCallback((points: number | null, feedback?: string) => {
    if (!currentSub || !currentQ) return;
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === currentSub.id
          ? {
              ...s,
              questions: s.questions.map((q, i) =>
                i === currentQIdx
                  ? { ...q, awardedPoints: points, feedback: feedback ?? q.feedback }
                  : q
              ),
            }
          : s
      )
    );
  }, [currentSub, currentQ, currentQIdx]);

  const updateFeedback = useCallback((feedback: string) => {
    if (!currentSub) return;
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === currentSub.id
          ? {
              ...s,
              questions: s.questions.map((q, i) =>
                i === currentQIdx ? { ...q, feedback } : q
              ),
            }
          : s
      )
    );
  }, [currentSub, currentQIdx]);

  const submitGrades = () => {
    if (!currentSub) return;
    const allGraded = currentSub.questions.every((q) => q.awardedPoints !== null);
    if (!allGraded) {
      toast({ title: "Incomplete", description: "Please grade all questions before submitting.", variant: "destructive" });
      return;
    }
    setSubmissions((prev) =>
      prev.map((s) => (s.id === currentSub.id ? { ...s, graded: true } : s))
    );
    toast({ title: "Grading saved", description: `${currentSub.studentName}'s submission has been graded.` });
    // Auto-advance to next ungraded
    const nextUngraded = submissions.find((s) => !s.graded && s.id !== currentSub.id);
    if (nextUngraded) {
      setSelectedStudentId(nextUngraded.id);
      setCurrentQIdx(0);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (step !== "grading" || !currentQ) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight" && currentQIdx < totalQuestions - 1) {
        e.preventDefault();
        setCurrentQIdx((p) => p + 1);
      } else if (e.key === "ArrowLeft" && currentQIdx > 0) {
        e.preventDefault();
        setCurrentQIdx((p) => p - 1);
      } else if (e.key === "0") {
        updateGrade(0);
      } else if (e.key === "5") {
        updateGrade(Math.round(currentQ.maxPoints / 2));
      } else if (e.key === "f" || e.key === "F") {
        updateGrade(currentQ.maxPoints);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, currentQIdx, totalQuestions, currentQ, updateGrade]);

  // ── Step: Course selection ──
  if (step === "course") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Grade Written Answers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Select a course to start grading.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCourses.map((c) => {
            const courseExams = mockExams[c.id] || [];
            const totalPending = courseExams.reduce((a, e) => a + e.pendingCount, 0);
            return (
              <Card key={c.id} className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all" onClick={() => { setSelectedCourse(c.id); setStep("exam"); }}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{c.id}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">{courseExams.length} exam(s)</Badge>
                      {totalPending > 0 && <Badge variant="destructive" className="text-[10px]">{totalPending} pending</Badge>}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Step: Exam selection ──
  if (step === "exam") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setStep("course"); setSelectedCourse(""); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{mockCourses.find((c) => c.id === selectedCourse)?.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Select an exam to grade</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exams.map((e) => (
            <Card key={e.id} className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all" onClick={() => { setSelectedExam(e.id); setStep("grading"); }}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{e.name}</p>
                  <Badge variant="destructive" className="text-[10px] flex items-center gap-1 mt-2 w-fit">
                    <Clock className="h-3 w-3" /> {e.pendingCount} pending
                  </Badge>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
          {exams.length === 0 && (
            <Card className="col-span-full bg-card/80 backdrop-blur-md border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No exams with written questions found.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ── Step: Grading interface (split panel) ──
  const overallProgress = submissions.length > 0 ? (gradedSubs.length / submissions.length) * 100 : 0;

  if (filteredSubs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setStep("exam"); setSelectedExam(""); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Grade Written Answers</h1>
        </div>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-12 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-60" />
            <p className="font-medium text-foreground">All done!</p>
            <p className="text-sm mt-1">No {filter === "pending" ? "pending" : ""} submissions to grade.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setStep("exam"); setSelectedExam(""); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Grade Written Answers</h1>
            <p className="text-xs text-muted-foreground">
              {mockCourses.find((c) => c.id === selectedCourse)?.name} • {exams.find((e) => e.id === selectedExam)?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => { setFilter(v as typeof filter); setSelectedStudentId(""); setCurrentQIdx(0); }}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({submissions.length})</SelectItem>
              <SelectItem value="pending">Pending ({pendingSubs.length})</SelectItem>
              <SelectItem value="graded">Graded ({gradedSubs.length})</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{Math.round(overallProgress)}%</span>
            <Progress value={overallProgress} className="h-1.5 w-20" />
          </div>
        </div>
      </div>

      {/* Split panel layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-xl border border-border/50 overflow-hidden bg-card/60 backdrop-blur-sm">
        {/* Left: Student list */}
        <ResizablePanel defaultSize={25} minSize={18} maxSize={35}>
          <div className="flex flex-col h-full">
            <div className="px-3 py-2.5 border-b border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Students ({filteredSubs.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredSubs.map((sub) => {
                const isActive = sub.id === currentSub?.id;
                const subGradedCount = sub.questions.filter((q) => q.awardedPoints !== null).length;
                const subTotal = sub.questions.length;
                const subProgress = subTotal > 0 ? (subGradedCount / subTotal) * 100 : 0;
                return (
                  <div
                    key={sub.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-border/30 transition-colors",
                      isActive ? "bg-primary/10" : "hover:bg-muted/40"
                    )}
                    onClick={() => { setSelectedStudentId(sub.id); setCurrentQIdx(0); }}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0",
                      sub.graded ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"
                    )}>
                      {sub.graded ? <CheckCircle className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{sub.studentName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">{sub.studentId}</span>
                        <Progress value={subProgress} className="h-1 flex-1 max-w-12" />
                        <span className="text-[10px] text-muted-foreground">{subGradedCount}/{subTotal}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Grading area */}
        <ResizablePanel defaultSize={75} minSize={50}>
          {currentSub && currentQ ? (
            <div className="flex flex-col h-full">
              {/* Question navigation */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentQIdx <= 0} onClick={() => setCurrentQIdx((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-foreground">
                    Question {currentQIdx + 1} of {totalQuestions}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentQIdx >= totalQuestions - 1} onClick={() => setCurrentQIdx((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Question dots */}
                  <div className="flex gap-1">
                    {currentSub.questions.map((q, i) => (
                      <button
                        key={q.id}
                        className={cn(
                          "h-2.5 w-2.5 rounded-full transition-colors",
                          i === currentQIdx ? "bg-primary scale-125" : q.awardedPoints !== null ? "bg-green-500" : "bg-muted-foreground/30"
                        )}
                        onClick={() => setCurrentQIdx(i)}
                      />
                    ))}
                  </div>
                  <Badge variant={currentSub.graded ? "default" : "secondary"} className="text-[10px]">
                    {currentSub.graded ? "Graded" : "Pending"}
                  </Badge>
                </div>
              </div>

              {/* Grading content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Student name bar */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{currentSub.studentName}</span>
                  <span className="text-muted-foreground font-mono text-xs">({currentSub.studentId})</span>
                </div>

                {/* Question text */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold text-primary mb-1.5 uppercase tracking-wider">Question</p>
                  <p className="text-sm text-foreground font-medium">{currentQ.questionText}</p>
                </div>

                {/* Rubric */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                    <MessageSquare className="h-3 w-3" /> Rubric
                  </p>
                  <p className="text-sm text-foreground">{currentQ.rubric}</p>
                </div>

                {/* Student answer */}
                <div className="rounded-lg border border-border/50 bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Student's Answer</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{currentQ.studentAnswer}</p>
                </div>

                {/* Points grading */}
                <div className="rounded-lg border border-border/50 bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Points</p>
                    <span className="text-lg font-bold text-foreground">
                      {currentQ.awardedPoints !== null ? currentQ.awardedPoints : "—"}<span className="text-sm text-muted-foreground font-normal">/{currentQ.maxPoints}</span>
                    </span>
                  </div>

                  {/* Slider */}
                  <Slider
                    value={[currentQ.awardedPoints ?? 0]}
                    max={currentQ.maxPoints}
                    step={1}
                    onValueChange={([val]) => updateGrade(val)}
                    className="w-full"
                  />

                  {/* Quick-grade buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("flex-1 text-xs", currentQ.awardedPoints === 0 && "border-destructive text-destructive")}
                      onClick={() => updateGrade(0)}
                    >
                      Zero (0)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("flex-1 text-xs", currentQ.awardedPoints === Math.round(currentQ.maxPoints / 2) && "border-yellow-500 text-yellow-600")}
                      onClick={() => updateGrade(Math.round(currentQ.maxPoints / 2))}
                    >
                      Half ({Math.round(currentQ.maxPoints / 2)})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("flex-1 text-xs", currentQ.awardedPoints === currentQ.maxPoints && "border-green-500 text-green-600")}
                      onClick={() => updateGrade(currentQ.maxPoints)}
                    >
                      Full ({currentQ.maxPoints})
                    </Button>
                  </div>
                </div>

                {/* Feedback */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feedback</label>
                  <Textarea
                    placeholder="Optional feedback for the student..."
                    value={currentQ.feedback}
                    onChange={(e) => updateFeedback(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Bottom actions bar */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-card/80">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Keyboard className="h-3 w-3" />
                  <span>←→ Navigate</span>
                  <span>•</span>
                  <span>0 Zero</span>
                  <span>•</span>
                  <span>5 Half</span>
                  <span>•</span>
                  <span>F Full</span>
                </div>
                <Button className="gap-2" size="sm" onClick={submitGrades} disabled={currentSub.graded}>
                  <Save className="h-3.5 w-3.5" />
                  {currentSub.graded ? "Already Graded" : "Submit Grades"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Select a student to start grading
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
