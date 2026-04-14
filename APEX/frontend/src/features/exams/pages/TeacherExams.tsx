import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen, Clock, Search, Plus, Filter, MoreHorizontal,
  Pencil, Eye, Trash2, Users, FileText, CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { useExams, useDeleteExam } from "@/hooks/useExams";
import { useToast } from "@/hooks/use-toast";

type ExamStatus = "upcoming" | "active" | "completed" | "draft";

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

function deriveStatus(exam: any): ExamStatus {
  if (exam.status) return exam.status;
  const now = new Date();
  if (exam.is_draft) return "draft";
  if (exam.end_time && new Date(exam.end_time) < now) return "completed";
  if (exam.start_time && new Date(exam.start_time) <= now) return "active";
  return "upcoming";
}

export default function TeacherExams() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: examsData, isLoading, error, refetch } = useExams();
  const deleteExamMutation = useDeleteExam();
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "all">("all");
  const [search, setSearch] = useState("");

  if (isLoading) return <PageSkeleton cards={4} rows={6} />;
  if (error) return <ErrorState message="Failed to load exams" onRetry={refetch} />;

  const exams = (examsData || []).map((e: any) => ({
    ...e,
    derivedStatus: deriveStatus(e),
    examDate: new Date(e.start_time || e.created_at || Date.now()),
  }));

  const stats = useMemo(() => ({
    total: exams.length,
    upcoming: exams.filter((e: any) => e.derivedStatus === "upcoming").length,
    active: exams.filter((e: any) => e.derivedStatus === "active").length,
    completed: exams.filter((e: any) => e.derivedStatus === "completed").length,
    drafts: exams.filter((e: any) => e.derivedStatus === "draft").length,
  }), [exams]);

  const filtered = useMemo(() => {
    return exams
      .filter((e: any) => statusFilter === "all" || e.derivedStatus === statusFilter)
      .filter((e: any) => !search || (e.title || "").toLowerCase().includes(search.toLowerCase()) || (e.class_name || "").toLowerCase().includes(search.toLowerCase()))
      .sort((a: any, b: any) => b.examDate.getTime() - a.examDate.getTime());
  }, [exams, statusFilter, search]);

  const handleDelete = async (id: number, title: string) => {
    try {
      await deleteExamMutation.mutateAsync(id);
      toast({ title: "Exam deleted", description: `${title} has been deleted.` });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

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
              {filtered.map((exam: any) => {
                const cfg = statusConfig[exam.derivedStatus as ExamStatus] || statusConfig.draft;
                return (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/60 p-4 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                        <span className="text-xs font-medium leading-none">{format(exam.examDate, "MMM")}</span>
                        <span className="text-lg font-bold leading-none">{format(exam.examDate, "d")}</span>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{exam.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {exam.class_name && <span className="truncate">{exam.class_name}</span>}
                          {exam.class_name && <span>&middot;</span>}
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration_minutes || 60} min</span>
                          <span>&middot;</span>
                          <span>{exam.problem_count || 0} questions</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {exam.derivedStatus === "completed" && exam.avg_score != null && (
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-foreground">{Math.round(exam.avg_score)}%</p>
                          <p className="text-[10px] text-muted-foreground">avg score</p>
                        </div>
                      )}
                      {(exam.derivedStatus === "completed" || exam.derivedStatus === "active") && (
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {exam.submission_count ?? 0}/{exam.student_count ?? 0}
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
                          <DropdownMenuItem className="gap-2" onClick={() => navigate("/dashboard/exam-builder", { state: { editExam: { id: exam.id, title: exam.title, duration: exam.duration_minutes, courseId: exam.class_id } } })}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => navigate(`/dashboard/exam-preview/${exam.id}`)}>
                            <Eye className="h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          {exam.derivedStatus === "completed" && (
                            <DropdownMenuItem className="gap-2" onClick={() => navigate("/dashboard/results", { state: { courseId: exam.class_id, examId: exam.id } })}>
                              <FileText className="h-4 w-4" /> View Results
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => handleDelete(exam.id, exam.title)}>
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
