import type { Question, QuestionType, MCQQuestion, WrittenQuestion, CodingQuestion } from "@/features/exams/types/exam";

export function createQuestion(type: QuestionType): Question {
  const base = { id: crypto.randomUUID(), points: 10, difficulty: "medium" as const, text: "", imageUrl: "" };
  switch (type) {
    case "mcq":
      return {
        ...base, type: "mcq",
        options: [
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
        ],
        correctOptionIds: [],
        multipleCorrect: false,
        explanation: "",
      } as MCQQuestion;
    case "written":
      return { ...base, type: "written", maxWordCount: 500, rubric: "", requireManualGrading: true } as WrittenQuestion;
    case "coding":
      return {
        ...base, type: "coding", description: "",
        starterCode: { python: "", javascript: "", c: "", cpp: "" },
        testCases: [], hints: "", timeLimitMs: 2000, memoryLimitKb: 262144,
      } as CodingQuestion;
  }
}

export function bankProblemToQuestion(p: any): Question {
  const base = { id: crypto.randomUUID(), serverId: p.id as number | undefined, points: p.points || 10, difficulty: (p.difficulty || "medium") as "easy" | "medium" | "hard", text: p.title || p.text || "", imageUrl: p.image_url || "" };
  const type = p.type || "coding";
  switch (type) {
    case "mcq": {
      const rawOpts = Array.isArray(p.options) ? p.options : (typeof p.options === "string" ? (() => { try { const parsed = JSON.parse(p.options || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })() : []);
      const opts = rawOpts.map((o: any, i: number) => {
        if (o && typeof o === "object") return { id: String(o.id ?? i), text: String(o.text ?? "") };
        return { id: String(i), text: String(o ?? "") };
      });
      const rawCorrect = Array.isArray(p.correct_option_ids)
        ? p.correct_option_ids
        : typeof p.correct_option_ids === "string"
          ? (() => { try { const parsed = JSON.parse(p.correct_option_ids || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })()
          : [];
      return {
        ...base, type: "mcq",
        options: opts.length > 0 ? opts : [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }],
        correctOptionIds: rawCorrect.map(String),
        multipleCorrect: p.multiple_correct || false,
        explanation: p.explanation || "",
      } as MCQQuestion;
    }
    case "written":
      return { ...base, type: "written", maxWordCount: p.max_word_count || 500, rubric: p.rubric || "", requireManualGrading: true } as WrittenQuestion;
    default:
      return {
        ...base, type: "coding", description: p.description || "",
        starterCode: { python: p.starter_code || "", javascript: p.starter_code || "" },
        testCases: (p.test_cases || []).map((tc: any) => ({ id: String(tc.id), input: tc.input, expectedOutput: tc.expected_output, isSample: tc.is_sample, points: tc.points || 0 })),
        hints: p.hints || "", timeLimitMs: p.time_limit_ms || 2000, memoryLimitKb: p.memory_limit_kb || 262144,
      } as CodingQuestion;
  }
}
