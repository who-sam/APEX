import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, BookOpen, AlertTriangle, ChevronRight } from "lucide-react";
import { useUser } from "@/contexts/AuthContext";

const activeExam = {
  id: "mid-ds",
  name: "Midterm — Data Structures",
  className: "CS201-A",
  remaining: "1h 23m",
  questions: 40,
  answered: 18,
};

const upcomingExams = [
  { id: 1, name: "JavaScript Fundamentals", date: "Mar 28, 2026", duration: "90 min", difficulty: "Medium", questions: 40 },
  { id: 2, name: "React & TypeScript", date: "Apr 01, 2026", duration: "120 min", difficulty: "Hard", questions: 35 },
  { id: 3, name: "Data Structures & Algorithms", date: "Apr 05, 2026", duration: "150 min", difficulty: "Hard", questions: 25 },
  { id: 4, name: "CSS & Responsive Design", date: "Apr 10, 2026", duration: "60 min", difficulty: "Easy", questions: 30 },
];

const recentActivity = [
  { text: "Submitted Quiz 3 — Algorithms", time: "2 hours ago", type: "submit" },
  { text: "Scored 92% on JavaScript Fundamentals", time: "1 day ago", type: "score" },
  { text: "Started React & TypeScript practice", time: "2 days ago", type: "start" },
  { text: "Enrolled in CS301-B", time: "3 days ago", type: "enroll" },
  { text: "Completed CSS module exercises", time: "4 days ago", type: "complete" },
];

const courses = [
  { name: "Data Structures", code: "CS201-A", progress: 72 },
  { name: "Algorithms", code: "CS301-B", progress: 45 },
  { name: "Web Development", code: "CS101-A", progress: 88 },
  { name: "Object-Oriented Programming", code: "CS102-B", progress: 60 },
];

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
            onClick={() => navigate(`/dashboard/exam/${activeExam.id}/take`)}
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
                  <p className="font-semibold text-foreground">{activeExam.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {activeExam.className} • {activeExam.answered}/{activeExam.questions} answered
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Clock className="h-4 w-4" />
                  {activeExam.remaining} remaining
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/dashboard/exam/${activeExam.id}/take`)}
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
            {recentActivity.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border/30 bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
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
            {courses.map((c) => (
              <div
                key={c.code}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60 cursor-pointer"
                onClick={() => navigate("/dashboard/courses")}
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.code}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{c.progress}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
