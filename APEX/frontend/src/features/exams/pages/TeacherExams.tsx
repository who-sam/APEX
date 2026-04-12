import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen, Clock, Search, Plus, Filter, MoreHorizontal,
  Pencil, Eye, Trash2, Users, FileText, CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

type ExamStatus = "upcoming" | "active" | "completed" | "draft";

interface TeacherExam {
  id: string;
  name: string;
  course: string;
  courseId: string;
  date: Date;
  duration: string;
  questions: number;
  status: ExamStatus;
  submissions?: number;
  totalStudents?: number;
  avgScore?: number;
}

const mockExams: TeacherExam[] = [
  { id: "ex-1", name: "Midterm Exam", course: "CS101 — Intro to Programming", courseId: "APX-CS101", date: new Date(2026, 2, 28), duration: "90 min", questions: 25, status: "upcoming", totalStudents: 45 },
  { id: "ex-2", name: "Quiz 3 — Linked Lists", course: "CS201 — Data Structures", courseId: "APX-CS201", date: new Date(2026, 2, 20), duration: "30 min", questions: 10, status: "completed", submissions: 36, totalStudents: 38, avgScore: 81 },
  { id: "ex-3", name: "Quiz 2 — Stacks & Queues", course: "CS201 — Data Structures", courseId: "APX-CS201", date: new Date(2026, 2, 10), duration: "30 min", questions: 10, status: "completed", submissions: 38, totalStudents: 38, avgScore: 76 },
  { id: "ex-4", name: "Quiz 1 — Arrays", course: "CS201 — Data Structures", courseId: "APX-CS201", date: new Date(2026, 1, 28), duration: "30 min", questions: 10, status: "completed", submissions: 37, totalStudents: 38, avgScore: 72 },
  { id: "ex-5", name: "Final Project Review", course: "CS301 — Algorithms", courseId: "APX-CS301", date: new Date(2026, 3, 15), duration: "120 min", questions: 8, status: "draft", totalStudents: 32 },
  { id: "ex-6", name: "Pop Quiz — Sorting", course: "CS301 — Algorithms", courseId: "APX-CS301", date: new Date(2026, 2, 25), duration: "15 min", questions: 5, status: "active", submissions: 18, totalStudents: 32 },
];

const statusConfig: Record<ExamStatus, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-accent/15 text-accent border-accent/30" },
  active: { label: "Active", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  completed: { label: "Completed", className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
};

const statusFilters: { value: ExamStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Drafts" },
];

export default function TeacherExams() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "all">("all");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => ({
    total: mockExams.length,
    upcoming: mockExams.filter((e) => e.status === "upcoming").length,
    active: mockExams.filter((e) => e.status === "active").length,
    completed: mockExams.filter((e) => e.status === "completed").length,
    drafts: mockExams.filter((e) => e.status === "draft").length,
  }), []);

  const filtered = useMemo(() => {
    return mockExams
      .filter((e) => statusFilter === "all" || e.status === statusFilter)
      .filter((e) => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.course.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [statusFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all your exams across courses.</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/dashboard/exam-builder")}>
          <Plus className="h-4 w-4" /> Create Exam
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Exams</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{stats.upcoming}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active Now</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            All Exams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search exams or courses..."
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
            <EmptyState
              icon={BookOpen}
              title="No exams found"
              description="Try adjusting your filters or create a new exam."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((exam) => {
                const cfg = statusConfig[exam.status];
                return (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/60 p-4 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                        <span className="text-xs font-medium leading-none">{format(exam.date, "MMM")}</span>
                        <span className="text-lg font-bold leading-none">{format(exam.date, "d")}</span>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{exam.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="truncate">{exam.course}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration}</span>
                          <span>·</span>
                          <span>{exam.questions} questions</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {exam.status === "completed" && exam.avgScore !== undefined && (
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-foreground">{exam.avgScore}%</p>
                          <p className="text-[10px] text-muted-foreground">avg score</p>
                        </div>
                      )}
                      {(exam.status === "completed" || exam.status === "active") && exam.submissions !== undefined && (
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {exam.submissions}/{exam.totalStudents}
                          </p>
                          <p className="text-[10px] text-muted-foreground">submissions</p>
                        </div>
                      )}
                      <Badge variant="outline" className={cfg.className}>
                        {cfg.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => navigate("/dashboard/exam-builder", { state: { editExam: { id: exam.id, title: exam.name, duration: parseInt(exam.duration), courseId: exam.courseId } } })}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => navigate(`/dashboard/exam-preview/${exam.id}`)}>
                            <Eye className="h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          {exam.status === "completed" && (
                            <DropdownMenuItem className="gap-2" onClick={() => navigate("/dashboard/results", { state: { courseId: exam.courseId, examId: exam.id } })}>
                              <FileText className="h-4 w-4" /> View Results
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
