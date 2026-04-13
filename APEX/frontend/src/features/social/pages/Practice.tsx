import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Clock, BookOpen, Zap, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStudentPractice } from "@/hooks/useStudentStats";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

export default function PracticePage() {
  const navigate = useNavigate();
  const { data: practiceExams, isLoading, error, refetch } = useStudentPractice();
  const [search, setSearch] = useState("");

  if (isLoading) return <PageSkeleton cards={6} />;
  if (error) return <ErrorState message="Failed to load practice exams" onRetry={refetch} />;

  const exams = practiceExams || [];

  const filtered = exams.filter((e: any) =>
    !search || (e.title || e.name || "").toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search practice exams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Exam cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search ? "No practice exams match your search" : "No practice exams available"}
          description={search ? "Try a different search term." : "Practice exams will appear here when available."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((exam: any) => (
            <Card key={exam.id} className="border-border/50 bg-card/80 backdrop-blur-md hover:border-primary/30 transition-all hover:shadow-md group">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {exam.title || exam.name}
                  </h3>
                  {exam.description && (
                    <p className="text-xs text-muted-foreground">{exam.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {exam.problem_count != null && (
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {exam.problem_count} Qs</span>
                  )}
                  {exam.duration_minutes != null && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exam.duration_minutes} min</span>
                  )}
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
      )}
    </div>
  );
}
