import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Flag, ChevronLeft, ChevronRight, Send, AlertTriangle, CheckSquare, FileText, Code2, PanelLeftClose, PanelLeft, Loader2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import type { Question, MCQQuestion, WrittenQuestion, CodingQuestion, StudentAnswer } from "@/types/exam";
import { useStudentExam } from "@/hooks/useExams";
import { submitSolution, runSolution } from "@/lib/api";
import { backendProblemToQuestion } from "@/lib/mappers";
import { PageSkeleton } from "@/components/PageSkeleton";

const initAnswers = (qs: Question[]): StudentAnswer[] =>
  qs.map((q) => ({ questionId: q.id, type: q.type, selectedOptionIds: [], textAnswer: "", code: "", language: "python", flagged: false }));

export default function ExamTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();

  const examId = Number(id);
  const { data, isLoading } = useStudentExam(examId);

  const exam = data?.exam;
  const existingSubmissions: any[] = data?.submissions ?? [];

  const questions: Question[] = (exam?.problems || []).map(backendProblemToQuestion);
  const durationMinutes = exam?.duration_minutes || 60;

  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  // Initialize answers when exam data loads
  useEffect(() => {
    if (questions.length > 0 && answers.length === 0) {
      const initial = initAnswers(questions);
      // Restore previously submitted answers
      for (const sub of existingSubmissions) {
        const qIdx = questions.findIndex((q) => q.id === String(sub.problem_id));
        if (qIdx >= 0) {
          if (sub.selected_options) {
            try {
              initial[qIdx].selectedOptionIds = typeof sub.selected_options === "string" ? JSON.parse(sub.selected_options) : sub.selected_options;
            } catch { /* ignore */ }
          }
          if (sub.text_answer) initial[qIdx].textAnswer = sub.text_answer;
          if (sub.code) initial[qIdx].code = sub.code;
          if (sub.language) initial[qIdx].language = sub.language;
        }
      }
      setAnswers(initial);
      setTimeLeft(durationMinutes * 60);
    }
  }, [questions.length, existingSubmissions.length]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft <= 0 || submitted) return;
    const tid = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(tid);
  }, [started, timeLeft, submitted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (started && timeLeft <= 0 && !submitted) {
      setSubmitted(true);
      setSubmitDialogOpen(false);
      toast({ title: "Time's up!", description: "Your exam has been submitted automatically." });
      setTimeout(() => navigate("/dashboard/results"), 1500);
    }
  }, [timeLeft, started, submitted, navigate, toast]);

  // Track visited questions
  useEffect(() => {
    if (started) {
      setVisitedQuestions((prev) => new Set(prev).add(currentIdx));
    }
  }, [currentIdx, started]);

  // Beforeunload
  useEffect(() => {
    if (!started || submitted) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [started, submitted]);

  const updateAnswer = useCallback((idx: number, partial: Partial<StudentAnswer>) => {
    setAnswers((prev) => prev.map((a, i) => (i === idx ? { ...a, ...partial } : a)));
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (isLoading) return <PageSkeleton />;

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5.5rem)]">
        <div className="max-w-lg w-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md p-8 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Exam Not Found</h1>
          <p className="text-sm text-muted-foreground">The exam you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/dashboard/upcoming")}>Back to Exams</Button>
        </div>
      </div>
    );
  }

  const mcqCount = questions.filter((q) => q.type === "mcq").length;
  const writtenCount = questions.filter((q) => q.type === "written").length;
  const codingCount = questions.filter((q) => q.type === "coding").length;

  const getStatus = (i: number) => {
    const a = answers[i];
    if (!a) return "unvisited";
    const isAnswered =
      (a.type === "mcq" && a.selectedOptionIds && a.selectedOptionIds.length > 0) ||
      (a.type === "written" && a.textAnswer && a.textAnswer.trim()) ||
      (a.type === "coding" && a.code && a.code.trim());
    if (isAnswered && a.flagged) return "answered-flagged";
    if (isAnswered) return "answered";
    if (a.flagged) return "flagged";
    if (visitedQuestions.has(i)) return "visited";
    return "unvisited";
  };

  const answeredCount = answers.filter((_, i) => { const s = getStatus(i); return s === "answered" || s === "answered-flagged"; }).length;
  const flaggedCount = answers.filter((a) => a.flagged).length;

  const handleSubmit = async () => {
    setSubmitted(true);
    setSubmitDialogOpen(false);
    // Submit each answer to backend
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      const q = questions[i];
      if (!q) continue;
      try {
        await submitSolution({
          problem_id: Number(q.id),
          exam_id: examId,
          type: q.type,
          language: a.language || "python",
          code: a.code || "",
          selected_options: a.selectedOptionIds ? JSON.stringify(a.selectedOptionIds) : "",
          text_answer: a.textAnswer || "",
        });
      } catch { /* best-effort submit */ }
    }
    toast({ title: "Exam submitted!", description: "Your responses have been recorded." });
    setTimeout(() => navigate("/dashboard/results"), 1000);
  };

  // Pre-exam screen
  if (!started) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5.5rem)]">
        <div className="max-w-lg w-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md p-8 space-y-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">{exam.description}</p>
          <div className="flex justify-center gap-4 text-sm">
            <Badge variant="secondary" className="gap-1"><CheckSquare className="h-3 w-3" /> {mcqCount} MCQ</Badge>
            <Badge variant="secondary" className="gap-1"><FileText className="h-3 w-3" /> {writtenCount} Written</Badge>
            <Badge variant="secondary" className="gap-1"><Code2 className="h-3 w-3" /> {codingCount} Coding</Badge>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{durationMinutes} minutes</span>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Once started, the timer cannot be paused. Make sure you have a stable connection.</span>
          </div>
          <Button size="lg" className="w-full text-base font-semibold" onClick={() => setStarted(true)}>
            Start Exam
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0 || answers.length === 0) return <PageSkeleton />;

  const q = questions[currentIdx];
  const ans = answers[currentIdx];

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/80 backdrop-blur-md px-4 py-2 mb-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          <h2 className="text-sm font-semibold text-foreground truncate">{exam.title}</h2>
        </div>
        <div className={cn("flex items-center gap-1.5 font-mono text-sm font-bold", timeLeft < 300 ? "text-destructive" : "text-foreground")}>
          <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
        </div>
        <Button size="sm" className="gap-1.5 rounded-full" onClick={() => setSubmitDialogOpen(true)} disabled={submitted}>
          <Send className="h-3.5 w-3.5" /> Submit
        </Button>
      </div>

      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-48 shrink-0 rounded-lg border border-border/50 bg-card/80 backdrop-blur-md p-3 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground mb-2">Questions</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((_, i) => {
                const status = getStatus(i);
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors",
                      i === currentIdx && "ring-2 ring-primary",
                      status === "answered" && "bg-primary/20 text-primary",
                      status === "answered-flagged" && "bg-amber-500/20 text-primary ring-1 ring-amber-500",
                      status === "flagged" && "bg-amber-500/20 text-amber-400",
                      status === "visited" && "bg-secondary text-muted-foreground",
                      status === "unvisited" && "bg-muted/50 text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-primary/20" /> Answered</div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-amber-500/20" /> Flagged</div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-secondary" /> Visited</div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-muted/50" /> Not visited</div>
            </div>
          </div>
        )}

        {/* Question area */}
        <div className="flex-1 rounded-lg border border-border/50 bg-card/80 backdrop-blur-md p-5 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs capitalize">{q.type}</Badge>
              <span className="text-xs text-muted-foreground">Question {currentIdx + 1} of {questions.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{q.points} pts</Badge>
              <Button
                variant={ans.flagged ? "default" : "ghost"}
                size="sm"
                className={cn("h-7 gap-1 text-xs", ans.flagged && "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30")}
                onClick={() => updateAnswer(currentIdx, { flagged: !ans.flagged })}
              >
                <Flag className="h-3 w-3" /> {ans.flagged ? "Flagged" : "Flag"}
              </Button>
            </div>
          </div>

          <h3 className="text-base font-semibold text-foreground mb-4">{q.text}</h3>

          {/* MCQ */}
          {q.type === "mcq" && (
            <div className="space-y-2 flex-1">
              {(q as MCQQuestion).options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    const ids = (q as MCQQuestion).multipleCorrect
                      ? ans.selectedOptionIds?.includes(opt.id)
                        ? ans.selectedOptionIds.filter((oid) => oid !== opt.id)
                        : [...(ans.selectedOptionIds || []), opt.id]
                      : [opt.id];
                    updateAnswer(currentIdx, { selectedOptionIds: ids });
                  }}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-colors",
                    ans.selectedOptionIds?.includes(opt.id)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/50 bg-card/40 text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <span className="text-sm">{opt.text}</span>
                </button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs mt-2"
                onClick={() => updateAnswer(currentIdx, { selectedOptionIds: [] })}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Written */}
          {q.type === "written" && (
            <div className="flex-1 flex flex-col">
              <Textarea
                value={ans.textAnswer || ""}
                onChange={(e) => updateAnswer(currentIdx, { textAnswer: e.target.value })}
                placeholder="Type your answer..."
                className="flex-1 min-h-[200px] resize-none"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{(ans.textAnswer || "").split(/\s+/).filter(Boolean).length} words</span>
                <span>Max: {(q as WrittenQuestion).maxWordCount} words</span>
              </div>
            </div>
          )}

          {/* Coding */}
          {q.type === "coding" && (
            <div className="flex-1 flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{(q as CodingQuestion).description}</p>
              <div className="flex-1 rounded-lg border border-border overflow-hidden min-h-[250px]">
                <Editor
                  height="100%"
                  language={ans.language || "python"}
                  value={ans.code || (q as CodingQuestion).starterCode[ans.language || "python"] || ""}
                  onChange={(v) => updateAnswer(currentIdx, { code: v || "" })}
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 8 } }}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={currentIdx === questions.length - 1}
              onClick={() => setCurrentIdx((i) => i + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Submit dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <p className="text-foreground">{answeredCount} answered, {flaggedCount} flagged, {questions.length - answeredCount} unanswered</p>
            <p className="text-muted-foreground">Are you sure you want to submit? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Confirm Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
