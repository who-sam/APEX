import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStudentExams } from "@/lib/api";
import type { ExamWithStatus } from "@/lib/api";

export default function PracticePage() {
  const [exams, setExams] = useState<ExamWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getStudentExams()
      .then(setExams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Practice</h1>
          <p className="mt-1 text-muted-foreground">Start an exam to practice your coding skills.</p>
        </div>
        <Button size="lg" className="gap-2 text-base font-semibold shadow-lg shadow-primary/25" onClick={() => navigate("/dashboard/editor")}>
          <Play className="h-5 w-5" />
          Open Code Playground
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-12">No exams available. Join a class to see assigned exams.</p>
        ) : (
          exams.map((exam) => (
            <Card key={exam.id} className="border-border/50 hover:border-primary/30 transition-all hover:shadow-md group">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{exam.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{exam.description || "No description"}</p>
                  </div>
                  <Badge variant="outline" className={
                    exam.status === "active" ? "bg-green-500/15 text-green-400 border-green-500/30" :
                    exam.status === "upcoming" ? "bg-accent/15 text-accent border-accent/30" :
                    "bg-muted text-muted-foreground border-border"
                  }>
                    {exam.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {exam.problem_count} problems</span>
                  {exam.duration_minutes > 0 && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exam.duration_minutes} min</span>
                  )}
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => navigate(`/dashboard/exam/${exam.id}`)}
                  disabled={exam.status === "completed"}
                >
                  <Play className="h-4 w-4" />
                  {exam.status === "completed" ? "Completed" : "Start Exam"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
