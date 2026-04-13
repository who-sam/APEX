import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, BookOpen, ArrowRight, Search, CheckCircle2, XCircle, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { useStudentExams } from "@/hooks/useExams";
import { format, isSameDay } from "date-fns";

type ExamStatus = "upcoming" | "active" | "completed" | "missed";

const statusFilters: { value: ExamStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

function deriveStatus(exam: any): ExamStatus {
  if (exam.status) return exam.status;
  const now = new Date();
  if (exam.end_time && new Date(exam.end_time) < now) return "completed";
  if (exam.start_time && new Date(exam.start_time) <= now) return "active";
  return "upcoming";
}

function getExamDate(exam: any): Date {
  return new Date(exam.start_time || exam.created_at || Date.now());
}

export default function UpcomingExamsPage() {
  const navigate = useNavigate();
  const { data: examsData, isLoading, error, refetch } = useStudentExams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "all">("all");
  const [search, setSearch] = useState("");

  if (isLoading) return <PageSkeleton cards={2} rows={5} />;
  if (error) return <ErrorState message="Failed to load exams" onRetry={refetch} />;

  const exams = (examsData || []).map((e: any) => ({
    ...e,
    derivedStatus: deriveStatus(e),
    examDate: getExamDate(e),
  }));

  const examDates = exams.map((e: any) => e.examDate);
  const selectedExam = selectedDate ? exams.find((e: any) => isSameDay(e.examDate, selectedDate)) : null;

  const stats = {
    total: exams.length,
    upcoming: exams.filter((e: any) => e.derivedStatus === "upcoming").length,
    active: exams.filter((e: any) => e.derivedStatus === "active").length,
    completed: exams.filter((e: any) => e.derivedStatus === "completed").length,
  };

  const filtered = exams
    .filter((e: any) => statusFilter === "all" || e.derivedStatus === statusFilter)
    .filter((e: any) => !search || (e.title || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => a.examDate.getTime() - b.examDate.getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Upcoming Exams</h1>
        <p className="mt-1 text-muted-foreground">View your exam schedule and prepare ahead.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
        {/* Exam list */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Exam Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search exams..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-secondary/30 border-border/50"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                {statusFilters.map((f) => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={statusFilter === f.value ? "default" : "outline"}
                    className="h-7 rounded-full text-xs px-3"
                    onClick={() => setStatusFilter(f.value)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon={BookOpen} title="No exams found" description="Try adjusting your filters." />
            ) : (
              <div className="space-y-3">
                {filtered.map((exam: any) => {
                  const isSelected = selectedDate && isSameDay(exam.examDate, selectedDate);
                  return (
                    <div
                      key={exam.id}
                      onClick={() => setSelectedDate(exam.examDate)}
                      className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                        isSelected ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border/50 bg-secondary/30 hover:bg-secondary/60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl ${
                          exam.derivedStatus === "completed" ? "bg-green-500/10 text-green-500"
                            : exam.derivedStatus === "active" ? "bg-blue-500/10 text-blue-500"
                            : "bg-primary/10 text-primary"
                        }`}>
                          <span className="text-xs font-medium leading-none">{format(exam.examDate, "MMM")}</span>
                          <span className="text-lg font-bold leading-none">{format(exam.examDate, "d")}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{exam.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{format(exam.examDate, "EEEE, MMM d")}</span>
                            <span>&middot;</span>
                            <span>{exam.duration_minutes || 60} min</span>
                            <span>&middot;</span>
                            <span>{exam.problem_count || 0} questions</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {exam.derivedStatus === "completed" && (
                          <Badge variant="outline" className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </Badge>
                        )}
                        {exam.derivedStatus === "active" && (
                          <Badge variant="outline" className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">Active</Badge>
                        )}
                        {exam.derivedStatus === "upcoming" && (
                          <Button size="sm" variant="ghost" className="gap-1 text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/exam/${exam.id}`); }}>
                            Prepare <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="self-start border-border/50 bg-card/80 backdrop-blur-md w-fit">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="p-0 pointer-events-auto"
              modifiers={{ exam: examDates }}
              modifiersClassNames={{ exam: "bg-primary/20 text-primary font-bold rounded-full" }}
            />
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{stats.total}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-2.5 text-center">
                <p className="text-lg font-bold text-green-500">{stats.completed}</p>
                <p className="text-[10px] text-muted-foreground">Done</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5 text-center">
                <p className="text-lg font-bold text-primary">{stats.upcoming}</p>
                <p className="text-[10px] text-muted-foreground">Upcoming</p>
              </div>
            </div>

            {selectedExam && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                <p className="font-semibold text-foreground">{selectedExam.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {selectedExam.duration_minutes || 60} min &middot; {selectedExam.problem_count || 0} questions
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
