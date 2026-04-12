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
import type {
  Question,
  MCQQuestion,
  WrittenQuestion,
  CodingQuestion,
  StudentAnswer,
} from "@/features/exams/types/exam";

/* ───────────────── Mock Exam Data ───────────────── */

const MOCK_EXAMS: Record<
  string,
  {
    title: string;
    description: string;
    durationMinutes: number;
    questions: Question[];
  }
> = {
  "1": {
    title: "JavaScript Fundamentals",
    description:
      "Covers variables, loops, functions, and basic DOM manipulation.",
    durationMinutes: 45,
    questions: [
      {
        id: "q1",
        type: "mcq",
        text: "What is the output of typeof null?",
        points: 5,
        difficulty: "easy",
        options: [
          { id: "a", text: '"null"' },
          { id: "b", text: '"object"' },
          { id: "c", text: '"undefined"' },
          { id: "d", text: '"number"' },
        ],
        correctOptionIds: ["b"],
        multipleCorrect: false,
        explanation: "",
      } as MCQQuestion,
      {
        id: "q2",
        type: "mcq",
        text: "Which keyword declares a block-scoped variable?",
        points: 5,
        difficulty: "easy",
        options: [
          { id: "a", text: "var" },
          { id: "b", text: "let" },
          { id: "c", text: "const" },
          { id: "d", text: "Both B and C" },
        ],
        correctOptionIds: ["d"],
        multipleCorrect: false,
        explanation: "",
      } as MCQQuestion,
      {
        id: "q3",
        type: "written",
        text: "Explain the difference between == and === in JavaScript. Provide examples.",
        points: 10,
        difficulty: "medium",
        maxWordCount: 200,
        rubric: "",
        requireManualGrading: true,
      } as WrittenQuestion,
      {
        id: "q4",
        type: "coding",
        text: "Reverse a String",
        points: 15,
        difficulty: "easy",
        description:
          "Write a function that reverses a given string without using the built-in reverse method.",
        starterCode: {
          python: "def reverse_string(s):\n    # Your code here\n    pass",
          javascript:
            "function reverseString(s) {\n    // Your code here\n}",
        },
        testCases: [
          {
            id: "t1",
            input: '"hello"',
            expectedOutput: '"olleh"',
            isSample: true,
          },
          {
            id: "t2",
            input: '"world"',
            expectedOutput: '"dlrow"',
            isSample: false,
          },
          {
            id: "t3",
            input: '"abcdef"',
            expectedOutput: '"fedcba"',
            isSample: false,
          },
        ],
        hints: "",
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
      } as CodingQuestion,
      {
        id: "q5",
        type: "written",
        text: "What are closures in JavaScript? Explain with a real-world use case.",
        points: 10,
        difficulty: "medium",
        maxWordCount: 250,
        rubric: "",
        requireManualGrading: true,
      } as WrittenQuestion,
      {
        id: "q6",
        type: "mcq",
        text: "Which array method does NOT mutate the original array?",
        points: 5,
        difficulty: "easy",
        options: [
          { id: "a", text: "push()" },
          { id: "b", text: "splice()" },
          { id: "c", text: "map()" },
          { id: "d", text: "sort()" },
        ],
        correctOptionIds: ["c"],
        multipleCorrect: false,
        explanation: "",
      } as MCQQuestion,
    ],
  },
  "mid-ds": {
    title: "Midterm — Data Structures",
    description:
      "Covers arrays, linked lists, stacks, queues, and basic algorithms.",
    durationMinutes: 90,
    questions: [
      {
        id: "q1",
        type: "mcq",
        text: "What is the time complexity of binary search?",
        points: 5,
        difficulty: "easy",
        options: [
          { id: "a", text: "O(n)" },
          { id: "b", text: "O(log n)" },
          { id: "c", text: "O(n²)" },
          { id: "d", text: "O(1)" },
        ],
        correctOptionIds: ["b"],
        multipleCorrect: false,
        explanation: "",
      } as MCQQuestion,
      {
        id: "q2",
        type: "written",
        text: "Explain the difference between a stack and a queue. Give real-world examples of each.",
        points: 15,
        difficulty: "medium",
        maxWordCount: 300,
        rubric: "",
        requireManualGrading: true,
      } as WrittenQuestion,
      {
        id: "q3",
        type: "coding",
        text: "Two Sum",
        points: 20,
        difficulty: "easy",
        description:
          "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.",
        starterCode: {
          python:
            "def two_sum(nums, target):\n    # Your code here\n    pass",
          javascript:
            "function twoSum(nums, target) {\n    // Your code here\n}",
        },
        testCases: [
          {
            id: "t1",
            input: "[2,7,11,15], 9",
            expectedOutput: "[0,1]",
            isSample: true,
          },
          {
            id: "t2",
            input: "[3,2,4], 6",
            expectedOutput: "[1,2]",
            isSample: false,
          },
        ],
        hints: "",
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
      } as CodingQuestion,
    ],
  },
  "algo-final": {
    title: "Algorithms Final Exam",
    description: "Graph algorithms, dynamic programming, and sorting.",
    durationMinutes: 120,
    questions: [
      {
        id: "q1",
        type: "mcq",
        text: "What is the best-case time complexity of QuickSort?",
        points: 5,
        difficulty: "medium",
        options: [
          { id: "a", text: "O(n log n)" },
          { id: "b", text: "O(n²)" },
          { id: "c", text: "O(n)" },
          { id: "d", text: "O(log n)" },
        ],
        correctOptionIds: ["a"],
        multipleCorrect: false,
        explanation: "",
      } as MCQQuestion,
      {
        id: "q2",
        type: "written",
        text: "Explain the difference between BFS and DFS. When would you prefer one over the other?",
        points: 15,
        difficulty: "medium",
        maxWordCount: 300,
        rubric: "",
        requireManualGrading: true,
      } as WrittenQuestion,
      {
        id: "q3",
        type: "coding",
        text: "Fibonacci (Dynamic Programming)",
        points: 20,
        difficulty: "medium",
        description:
          "Write a function that returns the nth Fibonacci number using dynamic programming (not recursion).",
        starterCode: {
          python: "def fibonacci(n):\n    # Your code here\n    pass",
          javascript: "function fibonacci(n) {\n    // Your code here\n}",
        },
        testCases: [
          {
            id: "t1",
            input: "10",
            expectedOutput: "55",
            isSample: true,
          },
          {
            id: "t2",
            input: "0",
            expectedOutput: "0",
            isSample: false,
          },
        ],
        hints: "",
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
      } as CodingQuestion,
    ],
  },
};

const ID_ALIASES: Record<string, string> = {
  "2": "mid-ds",
  "3": "algo-final",
  "4": "1",
  "5": "mid-ds",
  "6": "algo-final",
  "quiz-alg": "algo-final",
  "final-oop": "1",
};

export const EXAM_IDS = ["1", "mid-ds", "algo-final"];

function resolveExam(id: string | undefined) {
  if (!id) return null;
  if (MOCK_EXAMS[id]) return MOCK_EXAMS[id];
  const alias = ID_ALIASES[id];
  if (alias && MOCK_EXAMS[alias]) return MOCK_EXAMS[alias];
  const keys = Object.keys(MOCK_EXAMS);
  const index =
    Math.abs(
      id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % keys.length;
  return MOCK_EXAMS[keys[index]];
}

const initAnswers = (qs: Question[]): StudentAnswer[] =>
  qs.map((q) => ({
    questionId: q.id,
    type: q.type,
    selectedOptionIds: [],
    textAnswer: "",
    code: "",
    language: "python",
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

  const exam = resolveExam(id);

  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>(
    initAnswers(exam?.questions || [])
  );
  const [timeLeft, setTimeLeft] = useState(
    (exam?.durationMinutes || 60) * 60
  );
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [submitted, setSubmitted] = useState(false);

  // Coding: run state, input & output
  const [isRunning, setIsRunning] = useState(false);
  const [codeInput, setCodeInput] = useState<Record<string, string>>({});
  const [codeOutput, setCodeOutput] = useState<Record<string, string>>({});

  const questions = exam?.questions || [];

  // Timer
  useEffect(() => {
    if (!started || timeLeft <= 0 || submitted) return;
    const tid = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(tid);
  }, [started, timeLeft, submitted]);

  // Auto-submit
  useEffect(() => {
    if (started && timeLeft <= 0 && !submitted) {
      setSubmitted(true);
      setSubmitDialogOpen(false);
      toast({
        title: "Time's up!",
        description: "Your exam has been submitted automatically.",
      });
      setTimeout(() => navigate("/dashboard/results"), 1500);
    }
  }, [timeLeft, started, submitted, navigate, toast]);

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

  const handleSubmit = () => {
    setSubmitted(true);
    setSubmitDialogOpen(false);
    toast({
      title: "Exam submitted!",
      description: "Your responses have been recorded.",
    });
    setTimeout(() => navigate("/dashboard/results"), 1000);
  };

  const handleRunCode = (qId: string) => {
    setIsRunning(true);
    setCodeOutput((prev) => ({ ...prev, [qId]: "" }));
    const userInput = codeInput[qId] || "";
    setTimeout(() => {
      const lines: string[] = ["Compiling...", "Running..."];
      if (userInput.trim()) {
        lines.push("", `--- stdin (${userInput.split("\n").length} line(s)) ---`);
      }
      lines.push("", "Program executed successfully.", "", `Process finished with exit code 0`, `Execution time: ${Math.floor(Math.random() * 50 + 5)}ms | Memory: ${Math.floor(Math.random() * 5 + 2)}MB`);
      setCodeOutput((prev) => ({
        ...prev,
        [qId]: lines.join("\n"),
      }));
      setIsRunning(false);
    }, 1200);
  };

  /* ───── Not found ───── */
  if (!exam) {
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
            <span className="text-sm">{exam.durationMinutes} minutes</span>
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

  const q = questions[currentIdx];
  const ans = answers[currentIdx];

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
            disabled={submitted}
          >
            <Send className="h-3.5 w-3.5" /> Submit
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
                    {answers[i].flagged && (
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
              {q.type === "mcq" && (
                <div className="space-y-2">
                  {(q as MCQQuestion).multipleCorrect && (
                    <p className="text-xs text-muted-foreground">
                      Select all that apply
                    </p>
                  )}
                  {(q as MCQQuestion).options.map((opt) => {
                    const selected =
                      ans.selectedOptionIds?.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          const ids = (q as MCQQuestion).multipleCorrect
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
                            {opt.id.toUpperCase()}
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
                      Max: {(q as WrittenQuestion).maxWordCount} words
                    </span>
                  </div>
                </div>
              )}

              {/* ── Coding (no test cases shown) ── */}
              {q.type === "coding" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {(q as CodingQuestion).description}
                  </p>

                  {/* Language selector + Run */}
                  <div className="flex items-center justify-between">
                    <Select
                      value={ans.language || "python"}
                      onValueChange={(v) =>
                        updateAnswer(currentIdx, {
                          language: v,
                          code:
                            ans.code && ans.code.trim()
                              ? ans.code
                              : (q as CodingQuestion).starterCode[v] ||
                                "",
                        })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8 rounded-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(
                          (q as CodingQuestion).starterCode
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
                      language={ans.language || "python"}
                      value={
                        ans.code ||
                        (q as CodingQuestion).starterCode[
                          ans.language || "python"
                        ] ||
                        ""
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
            <Button onClick={handleSubmit}>Confirm Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
