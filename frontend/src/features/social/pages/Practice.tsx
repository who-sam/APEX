import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Clock, BookOpen, Zap, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useStudentPractice } from "@/hooks/useStudentStats";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

const diffColor = (d: string) => {
  if (d === "Easy") return "bg-green-500/15 text-green-500 border-green-500/30";
  if (d === "Medium") return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

export default function PracticePage() {
  const navigate = useNavigate();
  const { data: practiceData, isLoading, error, refetch } = useStudentPractice();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  if (isLoading) return <PageSkeleton cards={6} />;
  if (error) return <ErrorState message="Failed to load practice exams" onRetry={refetch} />;

  const exams = (practiceData || []).map((e: any) => ({
    id: e.id,
    name: e.title || e.name || "Untitled",
    category: e.category || "General",
    questions: e.problem_count ?? e.questions ?? 0,
    duration: e.duration_minutes ? `${e.duration_minutes} min` : (e.duration || ""),
    difficulty: e.difficulty || "Medium",
    completed: e.completed ?? e.progress ?? 0,
    description: e.description || "",
  }));

  // Derive unique categories from data
  const categories = ["All", ...Array.from(new Set(exams.map((e: any) => e.category)))];

  const filtered = exams.filter((e: any) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || e.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Practice</h1>
          <p className="mt-1 text-muted-foreground">Sharpen your skills with practice exams.</p>
        </div>
        {exams.length > 0 && (
          <Button
            size="lg"
            className="gap-2 text-base font-semibold shadow-lg shadow-primary/25"
            onClick={() => {
              const random = exams[Math.floor(Math.random() * exams.length)];
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
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              className="rounded-full text-xs"
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Exam cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search || category !== "All" ? "No practice exams match your filters" : "No practice exams available"}
          description={search || category !== "All" ? "Try adjusting your search or filters." : "Practice exams will appear here when available."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((exam: any) => (
            <Card key={exam.id} className="border-border/50 bg-card/80 backdrop-blur-md hover:border-primary/30 transition-all hover:shadow-md group">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{exam.name}</h3>
                    {exam.description && (
                      <p className="text-xs text-muted-foreground">{exam.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={diffColor(exam.difficulty)}>
                    {exam.difficulty}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {exam.questions > 0 && (
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {exam.questions} Qs</span>
                  )}
                  {exam.duration && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exam.duration}</span>
                  )}
                  <Badge variant="secondary" className="text-xs">{exam.category}</Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{exam.completed}%</span>
                  </div>
                  <Progress value={exam.completed} className="h-2" />
                </div>

                <Button
                  className="w-full gap-2"
                  variant={exam.completed > 0 ? "outline" : "default"}
                  onClick={() => navigate(`/dashboard/exam/${exam.id}`)}
                >
                  <Play className="h-4 w-4" />
                  {exam.completed > 0 ? "Continue" : "Start Practice"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
