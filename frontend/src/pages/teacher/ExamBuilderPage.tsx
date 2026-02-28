import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  BookOpen,
  Clock,
  Calendar,
  Users,
  Settings,
  Loader2,
  AlertCircle,
  ExternalLink,
  Check,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getExam,
  updateExam,
  addProblem,
  deleteProblem,
  assignExam,
  getClasses,
  type ExamData,
  type ProblemData,
  type ClassData,
} from "@/lib/api";

export default function ExamBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exam edit fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add problem dialog
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [addingProblem, setAddingProblem] = useState(false);
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [problemDifficulty, setProblemDifficulty] = useState("easy");
  const [problemStarterCode, setProblemStarterCode] = useState("");
  const [problemError, setProblemError] = useState<string | null>(null);

  // Assign to classes
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Deleting problem
  const [deletingProblemId, setDeletingProblemId] = useState<number | null>(
    null
  );

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [examData, classData] = await Promise.all([
        getExam(Number(id)),
        getClasses(),
      ]);
      setExam(examData);
      setClasses(classData);
      setTitle(examData.title);
      setDescription(examData.description || "");
      setDuration(String(examData.duration_minutes));
      setStartTime(
        examData.start_time
          ? new Date(examData.start_time).toISOString().slice(0, 16)
          : ""
      );
      setEndTime(
        examData.end_time
          ? new Date(examData.end_time).toISOString().slice(0, 16)
          : ""
      );
      // Pre-select currently assigned classes
      const assignedIds =
        examData.exam_classes?.map((ec) => ec.class_id) ?? [];
      setSelectedClassIds(assignedIds);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load exam data"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSaveExam() {
    if (!id || !title.trim()) return;
    try {
      setSaving(true);
      setSaveSuccess(false);
      const updated = await updateExam(Number(id), {
        title: title.trim(),
        description: description.trim() || undefined,
        duration_minutes: parseInt(duration) || 60,
        start_time: startTime ? new Date(startTime).toISOString() : undefined,
        end_time: endTime ? new Date(endTime).toISOString() : undefined,
      });
      setExam(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update exam"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddProblem() {
    if (!id || !problemTitle.trim()) {
      setProblemError("Problem title is required");
      return;
    }
    if (!problemDescription.trim()) {
      setProblemError("Problem description is required");
      return;
    }
    try {
      setAddingProblem(true);
      setProblemError(null);
      await addProblem(Number(id), {
        title: problemTitle.trim(),
        description: problemDescription.trim(),
        difficulty: problemDifficulty,
        starter_code: problemStarterCode.trim() || undefined,
      });
      setProblemDialogOpen(false);
      setProblemTitle("");
      setProblemDescription("");
      setProblemDifficulty("easy");
      setProblemStarterCode("");
      // Reload exam to get updated problems list
      const updated = await getExam(Number(id));
      setExam(updated);
    } catch (err) {
      setProblemError(
        err instanceof Error ? err.message : "Failed to add problem"
      );
    } finally {
      setAddingProblem(false);
    }
  }

  async function handleDeleteProblem(problemId: number) {
    try {
      setDeletingProblemId(problemId);
      await deleteProblem(problemId);
      const updated = await getExam(Number(id));
      setExam(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete problem"
      );
    } finally {
      setDeletingProblemId(null);
    }
  }

  function toggleClassSelection(classId: number) {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((cid) => cid !== classId)
        : [...prev, classId]
    );
  }

  async function handleAssignClasses() {
    if (!id) return;
    try {
      setAssigning(true);
      setAssignSuccess(false);
      await assignExam(Number(id), selectedClassIds);
      setAssignSuccess(true);
      setTimeout(() => setAssignSuccess(false), 2000);
      // Reload to reflect changes
      const updated = await getExam(Number(id));
      setExam(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to assign exam"
      );
    } finally {
      setAssigning(false);
    }
  }

  const difficultyColor = (d: string) => {
    if (d === "easy")
      return "bg-green-500/15 text-green-500 border-green-500/30";
    if (d === "medium") return "bg-accent/15 text-accent border-accent/30";
    return "bg-destructive/15 text-destructive border-destructive/30";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={() => navigate("/teacher/exams")}>
          Back to Exams
        </Button>
      </div>
    );
  }

  if (!exam) return null;

  const problems: ProblemData[] = exam.problems ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="mt-1"
            onClick={() => navigate("/teacher/exams")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Exam Builder
            </h1>
            <p className="mt-1 text-muted-foreground">
              Configure exam details, add problems, and assign to classes.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Exam Details */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Exam Details
          </CardTitle>
          <CardDescription>
            Edit the exam title, description, and schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exam-title">Title</Label>
              <Input
                id="exam-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-duration">Duration (minutes)</Label>
              <Input
                id="exam-duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-desc">Description</Label>
            <Textarea
              id="exam-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="exam-start">Start Time</Label>
              <Input
                id="exam-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-end">End Time</Label>
              <Input
                id="exam-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleSaveExam}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveSuccess ? "Saved!" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Problems */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                Problems
              </CardTitle>
              <CardDescription>
                {problems.length} problem{problems.length !== 1 ? "s" : ""} in
                this exam
              </CardDescription>
            </div>

            <Dialog
              open={problemDialogOpen}
              onOpenChange={setProblemDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Problem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Problem</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="prob-title">Title</Label>
                    <Input
                      id="prob-title"
                      placeholder="e.g. Two Sum"
                      value={problemTitle}
                      onChange={(e) => setProblemTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prob-desc">Description</Label>
                    <Textarea
                      id="prob-desc"
                      placeholder="Describe the problem..."
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prob-difficulty">Difficulty</Label>
                    <Select
                      value={problemDifficulty}
                      onValueChange={setProblemDifficulty}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prob-starter">
                      Starter Code (optional)
                    </Label>
                    <Textarea
                      id="prob-starter"
                      placeholder="function solution() {&#10;  // write your code here&#10;}"
                      value={problemStarterCode}
                      onChange={(e) => setProblemStarterCode(e.target.value)}
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                  {problemError && (
                    <p className="text-sm text-destructive">{problemError}</p>
                  )}
                  <Button
                    onClick={handleAddProblem}
                    disabled={addingProblem}
                    className="w-full gap-2"
                  >
                    {addingProblem && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Add Problem
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                No problems yet. Add your first problem to this exam.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Test Cases</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.map((problem, index) => (
                  <TableRow key={problem.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {problem.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={difficultyColor(problem.difficulty)}
                      >
                        {problem.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {problem.test_cases?.length ?? 0} cases
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-primary"
                          onClick={() =>
                            navigate(`/teacher/problems/${problem.id}`)
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive"
                          disabled={deletingProblemId === problem.id}
                          onClick={() => handleDeleteProblem(problem.id)}
                        >
                          {deletingProblemId === problem.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign to Classes */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Assign to Classes
          </CardTitle>
          <CardDescription>
            Select which classes can take this exam.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {classes.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">
              No classes available. Create a class first.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((cls) => {
                  const isSelected = selectedClassIds.includes(cls.id);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => toggleClassSelection(cls.id)}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/50 bg-secondary/30 hover:bg-secondary/60"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {cls.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cls.section} -- {cls.member_count} students
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
              <Button
                onClick={handleAssignClasses}
                disabled={assigning}
                className="gap-2"
              >
                {assigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : assignSuccess ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                {assignSuccess
                  ? "Assigned!"
                  : `Assign to ${selectedClassIds.length} Class${selectedClassIds.length !== 1 ? "es" : ""}`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
