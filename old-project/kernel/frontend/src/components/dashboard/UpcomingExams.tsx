import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { useStudentExams } from "@/hooks/useExams";
import { format } from "date-fns";

export function UpcomingExams() {
  const { data: exams, isLoading } = useStudentExams();

  const upcoming = (exams || [])
    .filter((e: any) => {
      if (!e.start_time) return true;
      return new Date(e.end_time || e.start_time) >= new Date();
    })
    .slice(0, 4)
    .map((e: any) => ({
      id: e.id,
      name: e.title,
      date: e.start_time ? format(new Date(e.start_time), "MMM d, yyyy") : "TBD",
      duration: `${e.duration_minutes || 60} min`,
    }));

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Upcoming Exams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming exams</p>
        ) : (
          upcoming.map((exam: any) => (
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
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
