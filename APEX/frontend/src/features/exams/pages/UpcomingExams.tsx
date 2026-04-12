import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, BookOpen, ArrowRight, Search, CheckCircle2, XCircle, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { format, isSameDay } from "date-fns";

type ExamStatus = "upcoming" | "completed" | "missed";

interface Exam {
  id: number;
  name: string;
  date: Date;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: number;
  subject: string;
  status: ExamStatus;
  score?: number;
}

const exams: Exam[] = [
  { id: 1, name: "JavaScript Fundamentals", date: new Date(2026, 1, 15), duration: "90 min", difficulty: "Medium", questions: 40, subject: "JavaScript", status: "completed", score: 87 },
  { id: 2, name: "HTML & Accessibility", date: new Date(2026, 1, 22), duration: "60 min", difficulty: "Easy", questions: 30, subject: "Web", status: "completed", score: 94 },
  { id: 3, name: "React & TypeScript", date: new Date(2026, 2, 8), duration: "120 min", difficulty: "Hard", questions: 35, subject: "React", status: "missed" },
  { id: 4, name: "Data Structures & Algorithms", date: new Date(2026, 2, 14), duration: "150 min", difficulty: "Hard", questions: 25, subject: "CS Core", status: "upcoming" },
  { id: 5, name: "CSS & Responsive Design", date: new Date(2026, 2, 20), duration: "60 min", difficulty: "Easy", questions: 30, subject: "CSS", status: "upcoming" },
  { id: 6, name: "Node.js Backend", date: new Date(2026, 2, 27), duration: "100 min", difficulty: "Medium", questions: 30, subject: "Backend", status: "upcoming" },
  { id: 7, name: "SQL & Database Design", date: new Date(2026, 3, 2), duration: "90 min", difficulty: "Medium", questions: 35, subject: "Database", status: "upcoming" },
];

const difficultyColor = (d: string) => {
  if (d === "Easy") return "bg-green-500/15 text-green-500 border-green-500/30";
  if (d === "Medium") return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

const statusFilters: { value: ExamStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
];

const difficultyFilters: { value: Exam["difficulty"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

export default function UpcomingExamsPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Exam["difficulty"] | "all">("all");
  const [search, setSearch] = useState("");

  const examDates = exams.map((e) => e.date);
  const selectedExam = selectedDate ? exams.find((e) => isSameDay(e.date, selectedDate)) : null;

  const stats = useMemo(() => ({
    total: exams.length,
    upcoming: exams.filter((e) => e.status === "upcoming").length,
    completed: exams.filter((e) => e.status === "completed").length,
    missed: exams.filter((e) => e.status === "missed").length,
  }), []);

  const filtered = useMemo(() => {
    return exams
      .filter((e) => statusFilter === "all" || e.status === statusFilter)
      .filter((e) => difficultyFilter === "all" || e.difficulty === difficultyFilter)
      .filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [statusFilter, difficultyFilter, search]);

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
                <span className="mx-1 h-4 w-px bg-border" />
                {difficultyFilters.map((f) => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={difficultyFilter === f.value ? "secondary" : "ghost"}
                    className="h-7 rounded-full text-xs px-3"
                    onClick={() => setDifficultyFilter(f.value)}
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
                {filtered.map((exam) => {
                  const isSelected = selectedDate && isSameDay(exam.date, selectedDate);
                  return (
                    <div
                      key={exam.id}
                      onClick={() => setSelectedDate(exam.date)}
                      className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary/50 bg-primary/5 shadow-sm"
                          : "border-border/50 bg-secondary/30 hover:bg-secondary/60"
                      } ${exam.status === "missed" ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 flex-col items-center justify-center rounded-xl ${
                          exam.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : exam.status === "missed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                        }`}>
                          <span className="text-xs font-medium leading-none">{format(exam.date, "MMM")}</span>
                          <span className="text-lg font-bold leading-none">{format(exam.date, "d")}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{exam.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{format(exam.date, "EEEE, MMM d")}</span>
                            <span>·</span>
                            <span>{exam.duration}</span>
                            <span>·</span>
                            <span>{exam.questions} questions</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={difficultyColor(exam.difficulty)}>
                          {exam.difficulty}
                        </Badge>
                        {exam.status === "completed" && (
                          <Badge variant="outline" className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {exam.score}%
                          </Badge>
                        )}
                        {exam.status === "missed" && (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Missed
                          </Badge>
                        )}
                        {exam.status === "upcoming" && (
                          <Button size="sm" variant="ghost" className="gap-1 text-primary" onClick={(e) => { e.stopPropagation(); navigate("/dashboard/start"); }}>
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
            {selectedExam && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                <p className="font-semibold text-foreground">{selectedExam.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {selectedExam.duration} · {selectedExam.questions} questions
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={difficultyColor(selectedExam.difficulty)}>
                    {selectedExam.difficulty}
                  </Badge>
                  {selectedExam.status === "completed" && (
                    <Badge className="bg-green-500/15 text-green-500 border-green-500/30" variant="outline">
                      {selectedExam.score}%
                    </Badge>
                  )}
                  {selectedExam.status === "missed" && (
                    <Badge variant="destructive">Missed</Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
