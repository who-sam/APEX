import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Plus,
  Clock,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getExams, createExam, type ExamData } from "@/lib/api";

export default function ExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDuration, setNewDuration] = useState("60");

  async function loadExams() {
    try {
      setLoading(true);
      setError(null);
      const data = await getExams();
      setExams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exams");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams();
  }, []);

  async function handleCreate() {
    if (!newTitle.trim()) {
      setCreateError("Exam title is required");
      return;
    }
    try {
      setCreating(true);
      setCreateError(null);
      const created = await createExam({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        duration_minutes: parseInt(newDuration) || 60,
      });
      setExams((prev) => [...prev, created]);
      setDialogOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewDuration("60");
      // Navigate to the builder for the new exam
      navigate(`/teacher/exams/${created.id}`);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create exam"
      );
    } finally {
      setCreating(false);
    }
  }

  function getExamStatus(exam: ExamData): {
    label: string;
    className: string;
  } {
    const now = new Date();
    if (exam.start_time && new Date(exam.start_time) > now) {
      return {
        label: "Upcoming",
        className: "bg-accent/15 text-accent border-accent/30",
      };
    }
    if (
      exam.start_time &&
      exam.end_time &&
      new Date(exam.start_time) <= now &&
      new Date(exam.end_time) > now
    ) {
      return {
        label: "Active",
        className: "bg-green-500/15 text-green-500 border-green-500/30",
      };
    }
    if (exam.end_time && new Date(exam.end_time) <= now) {
      return {
        label: "Completed",
        className:
          "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30",
      };
    }
    return {
      label: "Draft",
      className: "bg-primary/15 text-primary border-primary/30",
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={loadExams}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Exams
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage your exams.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="exam-title">Title</Label>
                <Input
                  id="exam-title"
                  placeholder="e.g. Midterm Exam - Data Structures"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam-description">Description</Label>
                <Textarea
                  id="exam-description"
                  placeholder="Describe what this exam covers..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam-duration">Duration (minutes)</Label>
                <Input
                  id="exam-duration"
                  type="number"
                  min="1"
                  placeholder="60"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                />
              </div>
              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Exam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exams Grid */}
      {exams.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <GraduationCap className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium text-foreground">No exams yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first exam to get started.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => {
            const status = getExamStatus(exam);
            return (
              <Card
                key={exam.id}
                className="border-border/50 transition-all hover:bg-secondary/40"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{exam.title}</CardTitle>
                      {exam.description && (
                        <CardDescription className="line-clamp-2">
                          {exam.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {exam.problem_count} problems
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {exam.class_count} classes
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {exam.duration_minutes} min
                    </span>
                  </div>

                  {(exam.start_time || exam.end_time) && (
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {exam.start_time && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Start:{" "}
                          {new Date(exam.start_time).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {exam.end_time && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          End:{" "}
                          {new Date(exam.end_time).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => navigate(`/teacher/exams/${exam.id}`)}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() =>
                        navigate(`/teacher/exams/${exam.id}/results`)
                      }
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
