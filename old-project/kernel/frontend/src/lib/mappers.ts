import { formatDistanceToNow } from "date-fns";
import type {
  Question,
  MCQQuestion,
  WrittenQuestion,
  CodingQuestion,
  MCQOption,
  TestCase,
} from "@/types/exam";

/** Convert backend Problem → frontend Question */
export function backendProblemToQuestion(p: any): Question {
  const base = {
    id: String(p.id),
    text: p.title || "",
    points: p.points ?? 10,
    difficulty: (p.difficulty || "medium") as "easy" | "medium" | "hard",
  };

  if (p.type === "mcq") {
    let options: MCQOption[] = [];
    try {
      options = typeof p.options === "string" ? JSON.parse(p.options) : p.options || [];
    } catch { options = []; }

    let correctOptionIds: string[] = [];
    try {
      correctOptionIds = typeof p.correct_option_ids === "string"
        ? JSON.parse(p.correct_option_ids)
        : p.correct_option_ids || [];
    } catch { correctOptionIds = []; }

    return {
      ...base,
      type: "mcq",
      options,
      correctOptionIds,
      multipleCorrect: p.multiple_correct ?? false,
      explanation: p.explanation || "",
    } as MCQQuestion;
  }

  if (p.type === "written") {
    return {
      ...base,
      type: "written",
      maxWordCount: p.max_word_count ?? 500,
      rubric: p.rubric || "",
      requireManualGrading: p.require_manual_grading ?? true,
    } as WrittenQuestion;
  }

  // coding
  const testCases: TestCase[] = (p.test_cases || []).map((tc: any) => ({
    id: String(tc.id),
    input: tc.input || "",
    expectedOutput: tc.expected_output || "",
    isSample: tc.is_sample ?? false,
  }));

  return {
    ...base,
    type: "coding",
    description: p.description || "",
    starterCode: p.starter_code ? { python: p.starter_code } : { python: "", javascript: "" },
    testCases,
    hints: p.hints || "",
    timeLimitMs: p.time_limit_ms ?? 2000,
    memoryLimitKb: p.memory_limit_kb ?? 262144,
  } as CodingQuestion;
}

/** Convert frontend Question → backend Problem payload */
export function questionToBackendProblem(q: Question, orderIndex: number): any {
  const base: any = {
    title: q.text,
    type: q.type,
    points: q.points,
    difficulty: q.difficulty,
    order_index: orderIndex,
  };

  if (q.type === "mcq") {
    const mcq = q as MCQQuestion;
    base.options = JSON.stringify(mcq.options);
    base.correct_option_ids = JSON.stringify(mcq.correctOptionIds);
    base.multiple_correct = mcq.multipleCorrect;
    base.explanation = mcq.explanation;
    base.description = q.text;
  } else if (q.type === "written") {
    const w = q as WrittenQuestion;
    base.max_word_count = w.maxWordCount;
    base.rubric = w.rubric;
    base.require_manual_grading = w.requireManualGrading;
    base.description = q.text;
  } else {
    const c = q as CodingQuestion;
    base.description = c.description || q.text;
    base.starter_code = c.starterCode?.python || "";
    base.hints = c.hints;
    base.time_limit_ms = c.timeLimitMs;
    base.memory_limit_kb = c.memoryLimitKb;
  }

  return base;
}

/** Format a date string to relative time (e.g. "2 minutes ago") */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}
