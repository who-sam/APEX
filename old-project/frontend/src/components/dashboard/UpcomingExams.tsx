import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { getStudentExams } from "@/lib/api";
import type { ExamWithStatus } from "@/lib/api";

const difficultyColor = (d: string) => {
  if (d === "Easy" || d === "easy") return "bg-green-500/15 text-green-400 border-green-500/30";
  if (d === "Medium" || d === "medium") return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

export function UpcomingExams() {
  const [exams, setExams] = useState<ExamWithStatus[]>([]);

  useEffect(() => {
    getStudentExams()
      .then((data) => {
        const upcoming = data
          .filter((e) => e.status === "upcoming" || e.status === "active")
          .slice(0, 4);
        setExams(upcoming);
      })
      .catch(() => {});
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Upcoming Exams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No upcoming exams</p>
        ) : (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60"
            >
              <div className="space-y-1">
                <p className="font-medium text-foreground">{exam.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {exam.start_time && <span>{new Date(exam.start_time).toLocaleDateString()}</span>}
                  {exam.duration_minutes > 0 && (
                    <>
                      <span>-</span>
                      <span>{exam.duration_minutes} min</span>
                    </>
                  )}
                  {exam.problem_count > 0 && (
                    <>
                      <span>-</span>
                      <span>{exam.problem_count} problems</span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={`${exam.status === "active" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-accent/15 text-accent border-accent/30"}`}>
                {exam.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
