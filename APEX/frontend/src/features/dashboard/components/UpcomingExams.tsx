import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const upcomingExams = [
  { id: 1, name: "JavaScript Fundamentals", date: "Feb 25, 2026", duration: "90 min", difficulty: "Medium", questions: 40 },
  { id: 2, name: "React & TypeScript", date: "Mar 01, 2026", duration: "120 min", difficulty: "Hard", questions: 35 },
  { id: 3, name: "Data Structures & Algorithms", date: "Mar 05, 2026", duration: "150 min", difficulty: "Hard", questions: 25 },
  { id: 4, name: "CSS & Responsive Design", date: "Mar 10, 2026", duration: "60 min", difficulty: "Easy", questions: 30 },
];

const difficultyColor = (d: string) => {
  if (d === "Easy") return "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
  if (d === "Medium") return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

export function UpcomingExams() {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Upcoming Exams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingExams.map((exam) => (
          <div
            key={exam.id}
            className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60"
          >
            <div className="space-y-1">
              <p className="font-medium text-foreground">{exam.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{exam.date}</span>
                <span>•</span>
                <span>{exam.duration}</span>
                <span>•</span>
                <span>{exam.questions} questions</span>
              </div>
            </div>
            <Badge variant="outline" className={difficultyColor(exam.difficulty)}>
              {exam.difficulty}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
