export type QuestionType = "mcq" | "written" | "coding";
export type Difficulty = "easy" | "medium" | "hard";

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  difficulty: Difficulty;
  imageUrl?: string;
}

export interface MCQOption {
  id: string;
  text: string;
}

export interface MCQQuestion extends BaseQuestion {
  type: "mcq";
  options: MCQOption[];
  correctOptionIds: string[];
  multipleCorrect: boolean;
  explanation: string;
}

export interface WrittenQuestion extends BaseQuestion {
  type: "written";
  maxWordCount: number;
  rubric: string;
  requireManualGrading: boolean;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  points?: number;
}

export interface CodingQuestion extends BaseQuestion {
  type: "coding";
  description: string;
  starterCode: Record<string, string>;
  testCases: TestCase[];
  hints: string;
  timeLimitMs: number;
  memoryLimitKb: number;
}

export type Question = MCQQuestion | WrittenQuestion | CodingQuestion;

export interface ExamSettings {
  shuffleQuestions: boolean;
  showResultsAfter: boolean;
  passingScore: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  questions: Question[];
  settings: ExamSettings;
  status: "draft" | "active" | "completed";
  className: string;
}

export interface StudentAnswer {
  questionId: string;
  type: QuestionType;
  selectedOptionIds?: string[];
  textAnswer?: string;
  code?: string;
  language?: string;
  flagged: boolean;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  answers: StudentAnswer[];
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
}

export interface ExamResult {
  examId: string;
  studentName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  rank: number;
  timeTaken: string;
}
