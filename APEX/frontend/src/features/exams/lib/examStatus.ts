export type ExamPhase = "upcoming" | "active" | "completed" | "missed";

export interface ExamTimingLike {
  start_time?: string | null;
  end_time?: string | null;
  status?: string;
  has_submitted?: boolean;
  submission_count?: number;
  score?: number | null;
}

export function getExamPhase(exam: ExamTimingLike, now: Date = new Date()): ExamPhase {
  if (exam.has_submitted) return "completed";
  if (exam.status === "completed") return "completed";
  if (exam.status === "missed") return "missed";

  const start = exam.start_time ? new Date(exam.start_time) : null;
  const end = exam.end_time ? new Date(exam.end_time) : null;

  if (end && end < now) {
    if (!exam.submission_count && exam.score == null) return "missed";
    return "completed";
  }
  if (!start) return "upcoming";
  if (start > now) return "upcoming";
  return "active";
}

export function isStartable(phase: ExamPhase): boolean {
  return phase === "active";
}
