import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, BookOpen, AlertTriangle, ChevronRight } from "lucide-react";
import { useUser } from "@/contexts/AuthContext";
import { useStudentStats } from "@/hooks/useStudentStats";
import { useStudentExams } from "@/hooks/useExams";
import { useStudentSubmissions } from "@/hooks/useSubmissions";
import { useMyAttempts } from "@/hooks/useAttempts";
import { useStudentClasses } from "@/hooks/useClasses";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { formatDistanceToNow } from "date-fns";

const difficultyColor = (d: string) => {
  if (d === "Easy") return "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
  if (d === "Medium") return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { name } = useUser();
  const firstName = name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: exams, isLoading: examsLoading, error: examsError, refetch } = useStudentExams();
  const { data: submissions } = useStudentSubmissions();
  const { data: attempts } = useMyAttempts();
  const { data: classes } = useStudentClasses();

  if (examsLoading || statsLoading) return <PageSkeleton cards={4} rows={3} />;
  if (examsError) return <ErrorState message="Failed to load dashboard" onRetry={refetch} />;

  const allExams = exams || [];
  const submittedExamIds = new Set((submissions || []).map((s: any) => Number(s.exam_id)));
  const activeExam = allExams.find(
    (e: any) => e.status === "active" && !submittedExamIds.has(Number(e.id))
  );
  const upcomingExams = allExams.filter((e: any) => e.status === "upcoming").slice(0, 4);
  const recentSubmissions = (attempts || [])
    .filter((a: any) => a.status === "submitted")
    .slice(0, 5)
    .map((a: any) => ({
      id: a.id,
      status: (a.score ?? 0) >= 60 ? "accepted" : a.status,
      score: a.score,
      submitted_at: a.submitted_at || a.started_at,
      exam_title: a.exam?.title,
    }));
  const enrolledClasses = classes || [];

  const hasActiveExam = !!activeExam;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Stay on top of your exams and track your progress.
          </p>
        </div>
        {hasActiveExam && (
          <Button
            size="lg"
            className="gap-2 text-base font-semibold shadow-lg shadow-primary/25"
            onClick={() => navigate(`/dashboard/exam/${activeExam.id}`)}
          >
            <Play className="h-5 w-5" />
            Continue Exam
          </Button>
        )}
      </div>

      {/* Active Exam Banner */}
      {hasActiveExam && (
        <Card className="border-primary/30 bg-primary/10 backdrop-blur-md">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{activeExam.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activeExam.class_name || ""} • {activeExam.problem_count || 0} questions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Clock className="h-4 w-4" />
                  {activeExam.duration_minutes || 60} min
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/dashboard/exam/${activeExam.id}`)}
                  className="gap-1.5"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Exams */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Upcoming Exams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming exams</p>
          ) : (
            upcomingExams.map((exam: any) => (
              <div
                key={exam.id}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60"
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{exam.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {exam.start_time && <span>{new Date(exam.start_time).toLocaleDateString()}</span>}
                    <span>•</span>
                    <span>{exam.duration_minutes || 60} min</span>
                    <span>•</span>
                    <span>{exam.problem_count || 0} questions</span>
                  </div>
                </div>
                <Badge variant="outline" className={difficultyColor(exam.difficulty || "Medium")}>
                  {exam.difficulty || "Upcoming"}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Bottom row: Recent Activity + Courses */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            ) : (
              recentSubmissions.map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-lg border border-border/30 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      {a.exam_title ? `${a.exam_title} — ` : ""}
                      {a.status === "accepted" ? "Passed" : a.status} — Score: {a.score?.toFixed(0) || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.submitted_at ? formatDistanceToNow(new Date(a.submitted_at), { addSuffix: true }) : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Courses */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrolledClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No courses enrolled</p>
            ) : (
              enrolledClasses.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60 cursor-pointer"
                  onClick={() => navigate(`/dashboard/courses/${c.id}`)}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.section || ""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${c.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{c.progress || 0}%</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
