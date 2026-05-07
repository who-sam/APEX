import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, BookOpen, ArrowRight, Search, CheckCircle2, XCircle, Filter, Lock, User, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { useStudentExams } from "@/hooks/useExams";
import { useMyAttempts } from "@/hooks/useAttempts";
import { format, isSameDay } from "date-fns";
import { getExamPhase, type ExamPhase } from "@/features/exams/lib/examStatus";

type ExamStatus = ExamPhase;
type Difficulty = "Easy" | "Medium" | "Hard";

const difficultyColor = (d: string) => {
  if (d === "Easy") return "bg-green-500/15 text-green-500 border-green-500/30";
  if (d === "Medium") return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

const statusFilters: { value: ExamStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
];

function deriveStatus(exam: any): ExamStatus {
  return getExamPhase(exam);
}

function getExamDate(exam: any): Date {
  return new Date(exam.start_time || exam.created_at || Date.now());
}

export default function UpcomingExamsPage() {
  const navigate = useNavigate();
  const { data: examsData, isLoading, error, refetch } = useStudentExams();
  const { data: attempts } = useMyAttempts();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "all">("all");
  const [search, setSearch] = useState("");

  if (isLoading) return <PageSkeleton cards={2} rows={5} />;
  if (error) return <ErrorState message="Failed to load exams" onRetry={refetch} />;

  const exams = (examsData || []).map((e: any) => ({
    ...e,
    derivedStatus: deriveStatus(e),
    examDate: getExamDate(e),
    name: e.title || e.name || "Untitled Exam",
    duration: e.duration_minutes ? `${e.duration_minutes} min` : "60 min",
    questions: e.problem_count || 0,
    difficulty: (e.difficulty as Difficulty) || "Medium",
  }));

  // Build set of exam IDs that have an in-progress (started but not submitted) attempt
  const inProgressExamIds = new Set<number>(
    (attempts || [])
      .filter((a: any) => a.status !== "submitted")
      .map((a: any) => Number(a.exam_id))
  );

  const examDates = exams.map((e: any) => e.examDate);

  // Exams matching the selected calendar date (may be multiple)
  const selectedDateExams = selectedDate
    ? exams.filter((e: any) => isSameDay(e.examDate, selectedDate))
    : [];
  const hasExamsOnSelectedDate = selectedDateExams.length > 0;

  const stats = useMemo(() => ({
    total: exams.length,
    upcoming: exams.filter((e: any) => e.derivedStatus === "upcoming").length,
    completed: exams.filter((e: any) => e.derivedStatus === "completed").length,
    missed: exams.filter((e: any) => e.derivedStatus === "missed").length,
  }), [exams]);

  const filtered = useMemo(() => {
    return exams
      .filter((e: any) => statusFilter === "all" || e.derivedStatus === statusFilter)
      .filter((e: any) => !search || e.name.toLowerCase().includes(search.toLowerCase()))
      // When a date with exams is selected, filter list to that day
      .filter((e: any) => !selectedDate || !hasExamsOnSelectedDate || isSameDay(e.examDate, selectedDate))
      .sort((a: any, b: any) => a.examDate.getTime() - b.examDate.getTime());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exams, statusFilter, search, selectedDate, hasExamsOnSelectedDate]);

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
            {/* Filter toolbar */}
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

            {/* Exam cards */}
            {filtered.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No exams found"
                description="Try adjusting your filters or search query."
              />
            ) : (
              <div className="space-y-3">
                {filtered.map((exam: any) => {
                  const isSelected = selectedDate && isSameDay(exam.examDate, selectedDate);
                  const isInProgress = inProgressExamIds.has(Number(exam.id));
                  return (
                    <div
                      key={exam.id}
                      onClick={() => setSelectedDate(exam.examDate)}
                      className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary/50 bg-primary/5 shadow-sm"
                          : "border-border/50 bg-secondary/30 hover:bg-secondary/60"
                      } ${exam.derivedStatus === "missed" ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl ${
                          exam.derivedStatus === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : exam.derivedStatus === "missed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                        }`}>
                          <span className="text-xs font-medium leading-none">{format(exam.examDate, "MMM")}</span>
                          <span className="text-lg font-bold leading-none">{format(exam.examDate, "d")}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{exam.name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {exam.start_time
                                ? format(exam.examDate, "EEEE, MMM d · h:mm a")
                                : format(exam.examDate, "EEEE, MMM d · TBD")}
                            </span>
                            <span>&middot;</span>
                            <span>{exam.duration}</span>
                            <span>&middot;</span>
                            <span>{exam.questions} questions</span>
                            {exam.teacher?.name && (
                              <>
                                <span>&middot;</span>
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />{exam.teacher.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {exam.derivedStatus === "completed" && (
                          <Badge variant="outline" className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {exam.score != null ? `${Math.round(exam.score)}%` : "Done"}
                          </Badge>
                        )}
                        {exam.derivedStatus === "missed" && (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Missed
                          </Badge>
                        )}
                        {exam.derivedStatus === "active" && (
                          <Button size="sm" variant="ghost" className="gap-1 text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/exam/${exam.id}/take`); }}>
                            {isInProgress ? "Continue Exam" : "Start Exam"} <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                        {exam.derivedStatus === "upcoming" && (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1">
                            <Lock className="h-3 w-3" />
                            {exam.start_time ? `Starts ${format(new Date(exam.start_time), "MMM d · h:mm a")}` : "Locked"}
                          </Badge>
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
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Calendar
              </span>
              {selectedDate && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDate(undefined)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="p-0 pointer-events-auto"
              classNames={{
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:rounded-md [&:has([aria-selected])]:bg-transparent h-9 w-9",
                day_selected: "rounded-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              }}
              modifiers={{ exam: examDates }}
              modifiersClassNames={{ exam: "bg-primary/20 text-primary font-bold rounded-full" }}
            />

            {/* Mini stats */}
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

            {/* Selected date detail */}
            {selectedDateExams.length > 0 && (
              <div className="space-y-2">
                {selectedDateExams.map((exam: any) => (
                  <div key={exam.id} className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                    <p className="font-semibold text-foreground">{exam.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {exam.start_time ? format(new Date(exam.start_time), "h:mm a") : "TBD"} &middot; {exam.duration} &middot; {exam.questions} questions
                    </div>
                    {exam.teacher?.name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {exam.teacher.name}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {exam.derivedStatus === "completed" && (
                        <Badge className="bg-green-500/15 text-green-500 border-green-500/30" variant="outline">
                          {exam.score != null ? `${Math.round(exam.score)}%` : "Done"}
                        </Badge>
                      )}
                      {exam.derivedStatus === "missed" && (
                        <Badge variant="destructive">Missed</Badge>
                      )}
                      {exam.derivedStatus === "active" && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-primary px-2" onClick={() => navigate(`/dashboard/exam/${exam.id}/take`)}>
                          {inProgressExamIds.has(Number(exam.id)) ? "Continue" : "Start"} <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
