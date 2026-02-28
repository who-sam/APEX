import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStudentExams } from "@/lib/api";
import type { ExamWithStatus } from "@/lib/api";

const statusColor = (s: string) => {
  if (s === "active") return "bg-green-500/15 text-green-400 border-green-500/30";
  if (s === "upcoming") return "bg-accent/15 text-accent border-accent/30";
  return "bg-muted text-muted-foreground border-border";
};

export default function UpcomingExamsPage() {
  const [exams, setExams] = useState<ExamWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getStudentExams()
      .then(setExams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sortedExams = [...exams].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    if (a.status === "upcoming" && b.status === "completed") return -1;
    if (b.status === "upcoming" && a.status === "completed") return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Upcoming Exams</h1>
        <p className="mt-1 text-muted-foreground">View your exam schedule and start exams.</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Exam Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedExams.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No exams available</p>
          ) : (
            sortedExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4 transition-all hover:bg-secondary/60"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{exam.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {exam.start_time && <span>{new Date(exam.start_time).toLocaleDateString()}</span>}
                      {exam.duration_minutes > 0 && (
                        <>
                          <span>-</span>
                          <span><Clock className="h-3 w-3 inline mr-0.5" />{exam.duration_minutes} min</span>
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
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={statusColor(exam.status)}>
                    {exam.status}
                  </Badge>
                  {(exam.status === "active" || exam.status === "upcoming") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-primary"
                      onClick={() => navigate(`/dashboard/exam/${exam.id}`)}
                    >
                      Start <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
