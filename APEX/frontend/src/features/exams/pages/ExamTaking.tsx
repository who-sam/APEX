import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckSquare,
  FileText,
  Code2,
  Play,
  Loader2,
  Terminal,
  ArrowRightLeft,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useStudentExam } from "@/hooks/useExams";
import { submitExamAttempt } from "@/lib/api";
import { useExecuteCode } from "@/hooks/useExecuteCode";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import type { StudentAnswer } from "@/features/exams/types/exam";

/* Map backend problem to frontend Question shape */
interface MappedQuestion {
  id: string;
  type: "mcq" | "written" | "coding";
  text: string;
  points: number;
  difficulty: string;
  // MCQ
  options?: { id: string; text: string }[];
  multipleCorrect?: boolean;
  correctOptionIds?: string[];
  explanation?: string;
  // Written
  maxWordCount?: number;
  rubric?: string;
  requireManualGrading?: boolean;
  // Coding
  description?: string;
  starterCode?: Record<string, string>;
  testCases?: { id: string; input: string; expectedOutput: string; isSample: boolean }[];
  hints?: string;
  timeLimitMs?: number;
  memoryLimitKb?: number;
}

function mapProblem(p: any): MappedQuestion {
  const base = {
    id: String(p.id),
    type: (p.type || "coding") as "mcq" | "written" | "coding",
    text: p.title || p.text || "",
    points: p.points || 10,
    difficulty: p.difficulty || "medium",
  };

  if (base.type === "mcq") {
    const opts = Array.isArray(p.options) ? p.options : (typeof p.options === "string" ? JSON.parse(p.options || "[]") : []);
    const correctIds = Array.isArray(p.correct_option_ids) ? p.correct_option_ids : (typeof p.correct_option_ids === "string" ? JSON.parse(p.correct_option_ids || "[]") : []);
    return {
      ...base,
      options: opts.map((o: any, i: number) => ({
        id: (o && typeof o === "object" ? (o.id || String(i)) : String(i)),
        text: (o && typeof o === "object" ? (o.text ?? "") : String(o)),
      })),
      multipleCorrect: p.multiple_correct || false,
      correctOptionIds: correctIds,
      explanation: p.explanation || "",
    };
  }

  if (base.type === "written") {
    return {
      ...base,
      description: p.description || "",
      maxWordCount: p.max_word_count || 500,
      rubric: p.rubric || "",
      requireManualGrading: p.require_manual_grading ?? true,
    };
  }

  // coding
  return {
    ...base,
    description: p.description || "",
    starterCode: { python3: p.starter_code || "", javascript: p.starter_code || "" },
    testCases: (p.test_cases || [])
      .filter((tc: any) => tc.is_sample)
      .map((tc: any) => ({
        id: String(tc.id),
        input: tc.input,
        expectedOutput: tc.expected_output,
        isSample: tc.is_sample,
      })),
    hints: p.hints || "",
    timeLimitMs: p.time_limit_ms || 2000,
    memoryLimitKb: p.memory_limit_kb || 262144,
  };
}

const initAnswers = (qs: MappedQuestion[]): StudentAnswer[] =>
  qs.map((q) => ({
    questionId: q.id,
    type: q.type,
    selectedOptionIds: [],
    textAnswer: "",
    code: "",
    language: "python3",
    flagged: false,
  }));

/* ───────────────── Question Type Icon ───────────────── */

function QuestionTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "mcq":
      return <CheckSquare className="h-3 w-3" />;
    case "written":
      return <FileText className="h-3 w-3" />;
    case "coding":
      return <Code2 className="h-3 w-3" />;
    default:
      return null;
  }
}

/* ───────────────── Main Component ───────────────── */

export default function ExamTaking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();

  const examId = Number(id);
  const { data: examData, isLoading, error, refetch } = useStudentExam(examId);
  const executeMutation = useExecuteCode();

  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);

  // Coding: run state, input & output
  const [codeInput, setCodeInput] = useState<Record<string, string>>({});
  const [codeOutput, setCodeOutput] = useState<Record<string, string>>({});
  const [runningQuestion, setRunningQuestion] = useState<string | null>(null);

  // Map backend exam data to questions
  const exam = examData?.exam;
  const questions: MappedQuestion[] = (exam?.problems || exam?.Problems || []).map(mapProblem);

  const sessionKey = `apex-exam-session-${examId}`;

  // Already-submitted check: at least one submission per problem
  const existingSubmissions: any[] = examData?.submissions || [];
  const submittedProblemIds = new Set(existingSubmissions.map((s: any) => Number(s.problem_id)));
  const allAlreadySubmitted =
    questions.length > 0 &&
    questions.every((q) => submittedProblemIds.has(Number(q.id)));

  // Initialize answers + restore session when questions load
  useEffect(() => {
    if (questions.length === 0 || answers.length > 0 || sessionRestored) return;

    const durationSec = (exam?.duration_minutes || 60) * 60;
    let initialAnswers = initAnswers(questions);
    let initialTimeLeft = durationSec;
    let restored = false;

    try {
      const raw = localStorage.getItem(sessionKey);
      if (raw) {
        const sess = JSON.parse(raw);
        const startedAtMs = new Date(sess.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
        const remaining = durationSec - elapsed;

        if (remaining > 0 && Array.isArray(sess.answers)) {
          // Merge saved answers keyed by questionId
          const savedById: Record<string, any> = {};
          sess.answers.forEach((a: any) => {
            if (a && a.questionId) savedById[a.questionId] = a;
          });
          initialAnswers = initialAnswers.map((a) => ({
            ...a,
            ...(savedById[a.questionId] || {}),
          }));
          initialTimeLeft = remaining;
          setStarted(true);
          setCurrentIdx(typeof sess.currentIdx === "number" ? sess.currentIdx : 0);
          setVisitedQuestions(new Set(sess.visitedQuestions || []));
          restored = true;
        } else {
          localStorage.removeItem(sessionKey);
        }
      }
    } catch {
      localStorage.removeItem(sessionKey);
    }

    setAnswers(initialAnswers);
    setTimeLeft(initialTimeLeft);
    setSessionRestored(true);
    void restored;
  }, [questions.length]);

  // Persist session on changes
  useEffect(() => {
    if (!started || submitted || answers.length === 0) return;
    try {
      const existing = localStorage.getItem(sessionKey);
      const startedAt = existing ? JSON.parse(existing).startedAt : new Date().toISOString();
      localStorage.setItem(
        sessionKey,
        JSON.stringify({
          startedAt,
          answers,
          currentIdx,
          visitedQuestions: Array.from(visitedQuestions),
        })
      );
    } catch {
      /* ignore */
    }
  }, [started, submitted, answers, currentIdx, visitedQuestions, sessionKey]);

  // Seed session on start click
  useEffect(() => {
    if (!started || submitted) return;
    try {
      if (!localStorage.getItem(sessionKey)) {
        localStorage.setItem(
          sessionKey,
          JSON.stringify({
            startedAt: new Date().toISOString(),
            answers,
            currentIdx: 0,
            visitedQuestions: [],
          })
        );
      }
    } catch {
      /* ignore */
    }
  }, [started]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft <= 0 || submitted) return;
    const tid = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(tid);
  }, [started, timeLeft, submitted]);

  // Auto-submit
  useEffect(() => {
    if (started && timeLeft <= 0 && !submitted && answers.length > 0) {
      doSubmit(true);
    }
  }, [timeLeft, started, submitted]);

  // Track visited
  useEffect(() => {
    if (started) {
      setVisitedQuestions((prev) => new Set(prev).add(currentIdx));
    }
  }, [currentIdx, started]);

  // Beforeunload
  useEffect(() => {
    if (!started || submitted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [started, submitted]);

  const updateAnswer = useCallback(
    (idx: number, partial: Partial<StudentAnswer>) => {
      setAnswers((prev) =>
        prev.map((a, i) => (i === idx ? { ...a, ...partial } : a))
      );
    },
    []
  );

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const getStatus = (i: number) => {
    const a = answers[i];
    if (!a) return "unvisited";
    const isAnswered =
      (a.type === "mcq" &&
        a.selectedOptionIds &&
        a.selectedOptionIds.length > 0) ||
      (a.type === "written" && a.textAnswer && a.textAnswer.trim()) ||
      (a.type === "coding" && a.code && a.code.trim());
    if (isAnswered && a.flagged) return "answered-flagged";
    if (isAnswered) return "answered";
    if (a.flagged) return "flagged";
    if (visitedQuestions.has(i)) return "visited";
    return "unvisited";
  };

  const answeredCount = answers.filter((_, i) => {
    const s = getStatus(i);
    return s === "answered" || s === "answered-flagged";
  }).length;
  const flaggedCount = answers.filter((a) => a.flagged).length;

  const doSubmit = async (auto = false) => {
    if (submitted || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitted(true);
    setSubmitDialogOpen(false);

    try {
      const answerPayloads: any[] = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const a = answers[i];
        const payload: any = {
          problem_id: Number(q.id),
          type: q.type,
        };

        if (q.type === "mcq" && a.selectedOptionIds && a.selectedOptionIds.length > 0) {
          payload.selected_options = JSON.stringify(a.selectedOptionIds);
        } else if (q.type === "written" && a.textAnswer?.trim()) {
          payload.text_answer = a.textAnswer;
        } else if (q.type === "coding" && a.code?.trim()) {
          payload.language = a.language || "python3";
          payload.code = a.code;
        } else {
          continue; // skip unanswered
        }

        answerPayloads.push(payload);
      }

      await submitExamAttempt(examId, answerPayloads);

      try {
        localStorage.removeItem(sessionKey);
      } catch {
        /* ignore */
      }

      toast({
        title: auto ? "Time's up!" : "Exam submitted!",
        description: auto
          ? "Your exam has been submitted automatically."
          : "Your responses have been recorded.",
      });
      setTimeout(() => navigate("/dashboard/results"), 1000);
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
      setSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunCode = (qId: string) => {
    const a = answers[questions.findIndex((q) => q.id === qId)];
    if (!a?.code?.trim()) return;

    setRunningQuestion(qId);
    setCodeOutput((prev) => ({ ...prev, [qId]: "" }));

    executeMutation.mutate(
      { language: a.language || "python3", code: a.code!, stdin: codeInput[qId] || undefined },
      {
        onSuccess: (data) => {
          const lines: string[] = [];
          if (data.stdout) lines.push(data.stdout);
          if (data.stderr) {
            lines.push("--- stderr ---");
            lines.push(data.stderr);
          }
          if (data.compile_output) {
            lines.push("--- Compilation ---");
            lines.push(data.compile_output);
          }
          lines.push("");
          lines.push(
            `Time: ${data.time_ms ?? 0}ms | Memory: ${data.memory_kb ? Math.round(data.memory_kb / 1024) + "MB" : "N/A"}`
          );
          setCodeOutput((prev) => ({ ...prev, [qId]: lines.join("\n") }));
          setRunningQuestion(null);
        },
        onError: (err: any) => {
          setCodeOutput((prev) => ({
            ...prev,
            [qId]: `Error: ${err.message}`,
          }));
          setRunningQuestion(null);
        },
      }
    );
  };

  /* ───── Loading / Error states ───── */
  if (isLoading) return <PageSkeleton rows={3} cards={0} />;
  if (error)
    return (
      <ErrorState
        message={(error as any).message || "Failed to load exam"}
        onRetry={refetch}
      />
    );

  /* ───── Not found ───── */
  if (!exam || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5.5rem)]">
        <div className="max-w-lg w-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md p-8 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Exam Not Found
          </h1>
          <p className="text-sm text-muted-foreground">
            The exam you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/dashboard/upcoming")}>
            Back to Exams
          </Button>
        </div>
      </div>
    );
  }

  const mcqCount = questions.filter((q) => q.type === "mcq").length;
  const writtenCount = questions.filter((q) => q.type === "written").length;
  const codingCount = questions.filter((q) => q.type === "coding").length;

  /* ───── Already-submitted screen ───── */
  if (allAlreadySubmitted && !submitted) {
    try {
      localStorage.removeItem(sessionKey);
    } catch {
      /* ignore */
    }
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5.5rem)]">
        <div className="max-w-lg w-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md p-8 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Exam Already Completed</h1>
          <p className="text-sm text-muted-foreground">
            You've already submitted this exam. Check your results for the outcome.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard/upcoming")}>
              Back to Exams
            </Button>
            <Button onClick={() => navigate("/dashboard/results")}>View Results</Button>
          </div>
        </div>
      </div>
    );
  }

  /* ───── Pre-exam screen ───── */
  if (!started) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-5.5rem)]">
        <div className="max-w-lg w-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md p-8 space-y-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            {exam.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {exam.description}
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Badge variant="secondary" className="gap-1">
              <CheckSquare className="h-3 w-3" /> {mcqCount} MCQ
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" /> {writtenCount} Written
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Code2 className="h-3 w-3" /> {codingCount} Coding
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{exam.duration_minutes || 60} minutes</span>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Once started, the timer cannot be paused. Make sure you have a
              stable connection.
            </span>
          </div>
          <Button
            size="lg"
            className="w-full text-base font-semibold"
            onClick={() => setStarted(true)}
          >
            Start Exam
          </Button>
        </div>
      </div>
    );
  }

  if (answers.length === 0) return <PageSkeleton rows={2} />;

  const q = questions[currentIdx];
  const ans = answers[currentIdx];
  const isRunning = runningQuestion === q.id;

  /* ───── Exam UI ───── */
  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/80 backdrop-blur-md px-4 py-2.5 mb-3">
        <h2 className="text-sm font-semibold text-foreground truncate">
          {exam.title}
        </h2>
        <div
          className={cn(
            "flex items-center gap-1.5 font-mono text-sm font-bold",
            timeLeft < 300 ? "text-destructive" : "text-foreground"
          )}
        >
          <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {answeredCount}/{questions.length} answered
          </span>
          {flaggedCount > 0 && (
            <Badge
              variant="outline"
              className="text-amber-500 border-amber-500/30 text-[10px]"
            >
              {flaggedCount} flagged
            </Badge>
          )}
          <Button
            size="sm"
            className="gap-1.5 rounded-full ml-2"
            onClick={() => setSubmitDialogOpen(true)}
            disabled={submitted || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* ── Floating Question Sidebar ── */}
        <div className="w-16 shrink-0 flex flex-col items-center">
          <ScrollArea className="flex-1 w-full">
            <div className="flex flex-col items-center gap-1.5 py-2">
              {questions.map((question, i) => {
                const status = getStatus(i);
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={cn(
                      "relative flex flex-col items-center justify-center w-11 h-11 rounded-xl text-xs font-semibold transition-all duration-200",
                      isCurrent &&
                        "ring-2 ring-primary shadow-lg shadow-primary/20 scale-110",
                      status === "answered" &&
                        "bg-primary/15 text-primary",
                      status === "answered-flagged" &&
                        "bg-primary/15 text-primary",
                      status === "flagged" &&
                        "bg-amber-500/15 text-amber-500",
                      status === "visited" &&
                        "bg-secondary text-muted-foreground",
                      status === "unvisited" &&
                        "bg-muted/40 text-muted-foreground/60",
                      !isCurrent && "hover:bg-secondary/80 hover:scale-105"
                    )}
                    title={`Q${i + 1} — ${question.type.toUpperCase()} (${question.points} pts)`}
                  >
                    <span className="leading-none">{i + 1}</span>
                    <QuestionTypeIcon type={question.type} />
                    {/* Flag dot */}
                    {answers[i]?.flagged && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-card" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Legend */}
          <div className="pt-2 border-t border-border/30 mt-1 space-y-1 w-full px-1">
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <div className="h-2 w-2 rounded-sm bg-primary/20" />
              <span>Done</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <div className="h-2 w-2 rounded-sm bg-amber-500/20" />
              <span>Flag</span>
            </div>
          </div>
        </div>

        {/* ── Question Content Area ── */}
        <div className="flex-1 rounded-xl border border-border/50 bg-card/80 backdrop-blur-md overflow-hidden flex flex-col">
          {/* Question header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs capitalize gap-1">
                <QuestionTypeIcon type={q.type} />
                {q.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Question {currentIdx + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {q.points} pts
              </Badge>
              <Button
                variant={ans.flagged ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 gap-1 text-xs rounded-full",
                  ans.flagged &&
                    "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                )}
                onClick={() =>
                  updateAnswer(currentIdx, { flagged: !ans.flagged })
                }
              >
                <Flag className="h-3 w-3" />{" "}
                {ans.flagged ? "Flagged" : "Flag"}
              </Button>
            </div>
          </div>

          {/* Question body — scrollable */}
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {q.text}
              </h3>

              {/* ── MCQ ── */}
              {q.type === "mcq" && q.options && (
                <div className="space-y-2">
                  {q.multipleCorrect && (
                    <p className="text-xs text-muted-foreground">
                      Select all that apply
                    </p>
                  )}
                  {q.options.map((opt, optIdx) => {
                    const selected =
                      ans.selectedOptionIds?.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          const ids = q.multipleCorrect
                            ? selected
                              ? ans.selectedOptionIds!.filter(
                                  (oid) => oid !== opt.id
                                )
                              : [...(ans.selectedOptionIds || []), opt.id]
                            : [opt.id];
                          updateAnswer(currentIdx, {
                            selectedOptionIds: ids,
                          });
                        }}
                        className={cn(
                          "w-full text-left rounded-xl border px-4 py-3 transition-all duration-150",
                          selected
                            ? "border-primary bg-primary/10 text-foreground shadow-sm"
                            : "border-border/50 bg-muted/20 text-muted-foreground hover:border-primary/40 hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex items-center justify-center h-6 w-6 rounded-full border-2 text-xs font-semibold shrink-0",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30 text-muted-foreground"
                            )}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span className="text-sm">{opt.text}</span>
                        </div>
                      </button>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs mt-1"
                    onClick={() =>
                      updateAnswer(currentIdx, { selectedOptionIds: [] })
                    }
                  >
                    Clear Selection
                  </Button>
                </div>
              )}

              {/* ── Written ── */}
              {q.type === "written" && (
                <div className="space-y-2">
                  <Textarea
                    value={ans.textAnswer || ""}
                    onChange={(e) =>
                      updateAnswer(currentIdx, {
                        textAnswer: e.target.value,
                      })
                    }
                    placeholder="Type your answer here..."
                    className="min-h-[220px] resize-none text-sm"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {
                        (ans.textAnswer || "")
                          .split(/\s+/)
                          .filter(Boolean).length
                      }{" "}
                      words
                    </span>
                    <span>
                      Max: {q.maxWordCount || 500} words
                    </span>
                  </div>
                </div>
              )}

              {/* ── Coding (no test cases shown) ── */}
              {q.type === "coding" && (
                <div className="space-y-3">
                  {q.description && (
                    <p className="text-sm text-muted-foreground">
                      {q.description}
                    </p>
                  )}

                  {/* Language selector + Run */}
                  <div className="flex items-center justify-between">
                    <Select
                      value={ans.language || "python3"}
                      onValueChange={(v) =>
                        updateAnswer(currentIdx, {
                          language: v,
                          code:
                            ans.code && ans.code.trim()
                              ? ans.code
                              : (q.starterCode?.[v] || ""),
                        })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8 rounded-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(q.starterCode
                          ? Object.keys(q.starterCode)
                          : ["python3", "javascript"]
                        ).map((l) => (
                          <SelectItem key={l} value={l} className="text-xs capitalize">
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-full h-8 text-xs"
                      onClick={() => handleRunCode(q.id)}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      {isRunning ? "Running..." : "Run Code"}
                    </Button>
                  </div>

                  {/* Code editor */}
                  <div className="rounded-xl border border-border overflow-hidden h-[300px]">
                    <Editor
                      height="100%"
                      language={
                        (ans.language || "python3") === "python3"
                          ? "python"
                          : (ans.language || "python3") === "cpp"
                            ? "cpp"
                            : (ans.language || "python3")
                      }
                      value={
                        ans.code ||
                        (q.starterCode?.[ans.language || "python3"] || "")
                      }
                      onChange={(v) =>
                        updateAnswer(currentIdx, { code: v || "" })
                      }
                      theme={theme === "dark" ? "vs-dark" : "light"}
                      options={{
                        fontSize: 13,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        padding: { top: 8 },
                        automaticLayout: true,
                        wordWrap: "on",
                      }}
                    />
                  </div>

                  {/* Custom Input */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
                      <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Custom Input
                      </span>
                    </div>
                    <Textarea
                      value={codeInput[q.id] || ""}
                      onChange={(e) =>
                        setCodeInput((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder="Enter your test input here (stdin)..."
                      className="min-h-[70px] max-h-[100px] resize-none rounded-none border-0 bg-transparent font-mono text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>

                  {/* Output console */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
                      <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Output
                      </span>
                      {isRunning && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      )}
                    </div>
                    <div className="p-3 min-h-[80px] max-h-[140px] overflow-auto">
                      {codeOutput[q.id] ? (
                        <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">
                          {codeOutput[q.id]}
                        </pre>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 text-center py-4">
                          Run your code to see output
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Navigation footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 rounded-full"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentIdx + 1} / {questions.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 rounded-full"
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
            <p className="text-foreground">
              {answeredCount} answered, {flaggedCount} flagged,{" "}
              {questions.length - answeredCount} unanswered
            </p>
            <p className="text-muted-foreground">
              Are you sure you want to submit? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmitDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => doSubmit(false)} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
