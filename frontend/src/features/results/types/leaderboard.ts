export interface LeaderboardEntry {
  rank: number;
  studentName: string;
  avatar: string;
  score: number;
  examsCompleted: number;
  streak: number;
  trend: "up" | "down" | "same";
  isCurrentUser?: boolean;
}
