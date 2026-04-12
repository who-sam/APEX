import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Clock, FileText, Code2, CheckSquare, HelpCircle, Eye,
} from "lucide-react";
import type { Question, MCQQuestion, WrittenQuestion, CodingQuestion } from "@/features/exams/types/exam";

/* ── Mock data (mirrors ExamTaking) ── */
const MOCK_EXAMS: Record<string, {
  title: string;
  description: string;
  course: string;
  durationMinutes: number;
  totalStudents: number;
  questions: Question[];
}> = {
  "ex-1": {
    title: "Midterm Exam",
    description: "Covers variables, loops, functions, and basic DOM manipulation.",
    course: "CS101 — Intro to Programming",
    durationMinutes: 90,
    totalStudents: 45,
    questions: [
      { id: "q1", type: "mcq", text: "What is the output of typeof null?", points: 5, difficulty: "easy", options: [{ id: "a", text: '"null"' }, { id: "b", text: '"object"' }, { id: "c", text: '"undefined"' }, { id: "d", text: '"number"' }], correctOptionIds: ["b"], multipleCorrect: false, explanation: 'typeof null returns "object" due to a historical bug in JavaScript.' } as MCQQuestion,
      { id: "q2", type: "mcq", text: "Which keyword declares a block-scoped variable?", points: 5, difficulty: "easy", options: [{ id: "a", text: "var" }, { id: "b", text: "let" }, { id: "c", text: "const" }, { id: "d", text: "Both B and C" }], correctOptionIds: ["d"], multipleCorrect: false, explanation: "" } as MCQQuestion,
      { id: "q3", type: "written", text: "Explain the difference between == and === in JavaScript. Provide examples.", points: 10, difficulty: "medium", maxWordCount: 200, rubric: "Must mention type coercion vs strict comparison", requireManualGrading: true } as WrittenQuestion,
      { id: "q4", type: "coding", text: "Reverse a String", points: 15, difficulty: "easy", description: "Write a function that reverses a given string without using the built-in reverse method.", starterCode: { javascript: "function reverseString(s) {\n    // Your code here\n}", python: "def reverse_string(s):\n    # Your code here\n    pass" }, testCases: [{ id: "t1", input: '"hello"', expectedOutput: '"olleh"', isSample: true }, { id: "t2", input: '"world"', expectedOutput: '"dlrow"', isSample: false }], hints: "", timeLimitMs: 2000, memoryLimitKb: 262144 } as CodingQuestion,
      { id: "q5", type: "written", text: "What are closures in JavaScript? Explain with a real-world use case.", points: 10, difficulty: "medium", maxWordCount: 250, rubric: "", requireManualGrading: true } as WrittenQuestion,
    ],
  },
  "ex-2": {
    title: "Quiz 3 — Linked Lists",
    description: "Short quiz covering linked list operations and traversal.",
    course: "CS201 — Data Structures",
    durationMinutes: 30,
    totalStudents: 38,
    questions: [
      { id: "q1", type: "mcq", text: "What is the time complexity of inserting at the head of a linked list?", points: 5, difficulty: "easy", options: [{ id: "a", text: "O(1)" }, { id: "b", text: "O(n)" }, { id: "c", text: "O(log n)" }, { id: "d", text: "O(n²)" }], correctOptionIds: ["a"], multipleCorrect: false, explanation: "Inserting at the head only requires updating the head pointer." } as MCQQuestion,
      { id: "q2", type: "written", text: "Describe the difference between a singly linked list and a doubly linked list.", points: 10, difficulty: "medium", maxWordCount: 200, rubric: "", requireManualGrading: true } as WrittenQuestion,
      { id: "q3", type: "coding", text: "Reverse a Linked List", points: 15, difficulty: "medium", description: "Write a function to reverse a singly linked list.", starterCode: { javascript: "function reverseList(head) {\n    // Your code here\n}", python: "def reverse_list(head):\n    # Your code here\n    pass" }, testCases: [{ id: "t1", input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]", isSample: true }], hints: "", timeLimitMs: 2000, memoryLimitKb: 262144 } as CodingQuestion,
    ],
  },
  "ex-3": {
    title: "Quiz 2 — Stacks & Queues",
    description: "Covers stack and queue implementations and use cases.",
    course: "CS201 — Data Structures",
    durationMinutes: 30,
    totalStudents: 38,
    questions: [
      { id: "q1", type: "mcq", text: "Which data structure uses LIFO ordering?", points: 5, difficulty: "easy", options: [{ id: "a", text: "Queue" }, { id: "b", text: "Stack" }, { id: "c", text: "Array" }, { id: "d", text: "Linked List" }], correctOptionIds: ["b"], multipleCorrect: false, explanation: "Stack follows Last-In-First-Out ordering." } as MCQQuestion,
      { id: "q2", type: "written", text: "Explain a real-world use case for both a stack and a queue.", points: 10, difficulty: "medium", maxWordCount: 200, rubric: "", requireManualGrading: true } as WrittenQuestion,
    ],
  },
  "ex-5": {
    title: "Final Project Review",
    description: "Final project review for algorithms course.",
    course: "CS301 — Algorithms",
    durationMinutes: 120,
    totalStudents: 32,
    questions: [
      { id: "q1", type: "written", text: "Describe the dynamic programming approach to the knapsack problem.", points: 20, difficulty: "hard", maxWordCount: 400, rubric: "", requireManualGrading: true } as WrittenQuestion,
      { id: "q2", type: "coding", text: "Implement Dijkstra's Algorithm", points: 25, difficulty: "hard", description: "Implement Dijkstra's shortest path algorithm for a weighted graph.", starterCode: { javascript: "function dijkstra(graph, start) {\n    // Your code here\n}", python: "def dijkstra(graph, start):\n    # Your code here\n    pass" }, testCases: [{ id: "t1", input: "graph, 'A'", expectedOutput: "shortest distances", isSample: true }], hints: "", timeLimitMs: 5000, memoryLimitKb: 262144 } as CodingQuestion,
    ],
  },
  "ex-6": {
    title: "Pop Quiz — Sorting",
    description: "Quick quiz on sorting algorithms.",
    course: "CS301 — Algorithms",
    durationMinutes: 15,
    totalStudents: 32,
    questions: [
      { id: "q1", type: "mcq", text: "What is the best-case time complexity of QuickSort?", points: 5, difficulty: "medium", options: [{ id: "a", text: "O(n log n)" }, { id: "b", text: "O(n²)" }, { id: "c", text: "O(n)" }, { id: "d", text: "O(log n)" }], correctOptionIds: ["a"], multipleCorrect: false, explanation: "QuickSort achieves O(n log n) when the pivot divides the array evenly." } as MCQQuestion,
      { id: "q2", type: "mcq", text: "Which sorting algorithm is stable?", points: 5, difficulty: "easy", options: [{ id: "a", text: "QuickSort" }, { id: "b", text: "HeapSort" }, { id: "c", text: "MergeSort" }, { id: "d", text: "Selection Sort" }], correctOptionIds: ["c"], multipleCorrect: false, explanation: "MergeSort maintains relative order of equal elements." } as MCQQuestion,
    ],
  },
};

const typeIcon: Record<string, React.ElementType> = {
  mcq: CheckSquare,
  written: FileText,
  coding: Code2,
};

const typeLabel: Record<string, string> = {
  mcq: "Multiple Choice",
  written: "Written",
  coding: "Coding",
};

export default function ExamPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = id ? MOCK_EXAMS[id] : null;

  if (!exam) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard/exams")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Exams
        </Button>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Exam Not Found</h2>
            <p className="text-sm text-muted-foreground">No preview data available for this exam.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPoints = exam.questions.reduce((s, q) => s + q.points, 0);
  const mcqCount = exam.questions.filter((q) => q.type === "mcq").length;
  const writtenCount = exam.questions.filter((q) => q.type === "written").length;
  const codingCount = exam.questions.filter((q) => q.type === "coding").length;

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate("/dashboard/exams")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Exams
      </Button>

      {/* Preview banner */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-center gap-3">
        <Eye className="h-5 w-5 text-accent shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Preview Mode</p>
          <p className="text-xs text-muted-foreground">This is how the exam appears to students. No answers will be recorded.</p>
        </div>
      </div>

      {/* Header */}
      <Card className="bg-card/80 backdrop-blur-md border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{exam.course}</p>
              <p className="text-sm text-muted-foreground mt-2">{exam.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{exam.durationMinutes} minutes</span>
              </div>
              <Badge variant="secondary" className="text-xs">{totalPoints} points</Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{exam.questions.length} questions</span>
            </div>
            {mcqCount > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckSquare className="h-4 w-4" />
                <span>{mcqCount} MCQ</span>
              </div>
            )}
            {writtenCount > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{writtenCount} Written</span>
              </div>
            )}
            {codingCount > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Code2 className="h-4 w-4" />
                <span>{codingCount} Coding</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {exam.questions.map((q, i) => {
          const TypeIcon = typeIcon[q.type];
          return (
            <Card key={q.id} className="bg-card/80 backdrop-blur-md border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <Badge variant="outline" className="gap-1 capitalize">
                      <TypeIcon className="h-3 w-3" />
                      {typeLabel[q.type]}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs">{q.points} pts</Badge>
                </div>
                <CardTitle className="text-base mt-3">{q.text}</CardTitle>
              </CardHeader>
              <CardContent>
                {q.type === "mcq" && (
                  <div className="space-y-2">
                    {(q as MCQQuestion).options.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3 text-sm text-foreground"
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-medium text-muted-foreground shrink-0">
                          {opt.id.toUpperCase()}
                        </div>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "written" && (
                  <div className="rounded-lg border border-dashed border-border/50 bg-secondary/10 p-6 text-center">
                    <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Text response area • {(q as WrittenQuestion).maxWordCount} word limit
                    </p>
                  </div>
                )}

                {q.type === "coding" && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{(q as CodingQuestion).description}</p>
                    <div className="rounded-lg border border-border/50 bg-muted/50 p-4 font-mono text-xs text-muted-foreground whitespace-pre">
                      {Object.values((q as CodingQuestion).starterCode)[0]}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{(q as CodingQuestion).testCases.length} test cases</span>
                      <span>•</span>
                      <span>{(q as CodingQuestion).testCases.filter((t) => t.isSample).length} sample</span>
                      <span>•</span>
                      <span>Time limit: {(q as CodingQuestion).timeLimitMs}ms</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
