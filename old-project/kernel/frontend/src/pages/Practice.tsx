import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Clock, BookOpen, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStudentPractice } from "@/hooks/useStudentStats";
import { PageSkeleton } from "@/components/PageSkeleton";

const diffColor = (d: string) => {
  if (d === "easy" || d === "Easy") return "bg-green-500/15 text-green-500 border-green-500/30";
  if (d === "medium" || d === "Medium") return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

export default function PracticePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: raw, isLoading } = useStudentPractice();

  const practiceExams = (raw || []).map((exam: any) => ({
    id: exam.id,
    name: exam.title || "Untitled",
    questions: exam.problems?.length ?? 0,
    duration: `${exam.duration_minutes || 60} min`,
    difficulty: exam.difficulty || "medium",
    description: exam.description || "",
  }));

  const filtered = practiceExams.filter((e: any) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Practice</h1>
          <p className="mt-1 text-muted-foreground">Sharpen your skills with practice exams.</p>
        </div>
        {practiceExams.length > 0 && (
          <Button
            size="lg"
            className="gap-2 text-base font-semibold shadow-lg shadow-primary/25"
            onClick={() => {
              const random = practiceExams[Math.floor(Math.random() * practiceExams.length)];
              if (random) navigate(`/dashboard/exam/${random.id}`);
            }}
          >
            <Zap className="h-5 w-5" />
            Quick Random Quiz
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search practice exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Exam cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((exam: any) => (
          <Card key={exam.id} className="border-border/50 bg-card/80 backdrop-blur-md hover:border-primary/30 transition-all hover:shadow-md group">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{exam.name}</h3>
                  <p className="text-xs text-muted-foreground">{exam.description}</p>
                </div>
                <Badge variant="outline" className={diffColor(exam.difficulty)}>
                  {exam.difficulty}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {exam.questions} Qs</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exam.duration}</span>
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => navigate(`/dashboard/exam/${exam.id}`)}
              >
                <Play className="h-4 w-4" />
                Start Practice
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {practiceExams.length === 0 ? "No practice exams available yet." : "No practice exams match your search."}
          </p>
        </div>
      )}
    </div>
  );
}
