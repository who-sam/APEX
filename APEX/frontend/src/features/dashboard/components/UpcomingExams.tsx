import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useStudentExams } from "@/hooks/useExams";
import { format } from "date-fns";

export function UpcomingExams() {
  const { data: examsData } = useStudentExams();
  const upcoming = (examsData || [])
    .filter((e: any) => e.status === "upcoming")
    .slice(0, 4);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Upcoming Exams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming exams</p>
        ) : (
          upcoming.map((exam: any) => (
            <div
              key={exam.id}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60"
            >
              <div className="space-y-1">
                <p className="font-medium text-foreground">{exam.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{exam.start_time ? format(new Date(exam.start_time), "MMM d, yyyy") : "TBD"}</span>
                  <span>&bull;</span>
                  <span>{exam.duration_minutes || 60} min</span>
                  <span>&bull;</span>
                  <span>{exam.problem_count || 0} questions</span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
