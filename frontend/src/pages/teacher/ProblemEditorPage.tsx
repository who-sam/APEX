import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Pencil,
  Code,
  FlaskConical,
  Lightbulb,
  Check,
  X,
  Loader2,
  AlertCircle,
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
import { Switch } from "@/components/ui/switch";
import {
  getProblem,
  updateProblem,
  addTestCase,
  updateTestCase,
  deleteTestCase,
  type ProblemData,
  type TestCaseData,
} from "@/lib/api";

export default function ProblemEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Problem fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [starterCode, setStarterCode] = useState("");
  const [hints, setHints] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test case dialog
  const [testCaseDialogOpen, setTestCaseDialogOpen] = useState(false);
  const [addingTestCase, setAddingTestCase] = useState(false);
  const [tcInput, setTcInput] = useState("");
  const [tcExpectedOutput, setTcExpectedOutput] = useState("");
  const [tcIsSample, setTcIsSample] = useState(true);
  const [tcError, setTcError] = useState<string | null>(null);

  // Edit test case
  const [editingTc, setEditingTc] = useState<TestCaseData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTcInput, setEditTcInput] = useState("");
  const [editTcExpectedOutput, setEditTcExpectedOutput] = useState("");
  const [editTcIsSample, setEditTcIsSample] = useState(true);
  const [updatingTc, setUpdatingTc] = useState(false);
  const [editTcError, setEditTcError] = useState<string | null>(null);

  // Deleting test case
  const [deletingTcId, setDeletingTcId] = useState<number | null>(null);

  const loadProblem = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const problemData = await getProblem(Number(id));
      setProblem(problemData);
      setTitle(problemData.title);
      setDescription(problemData.description);
      setDifficulty(problemData.difficulty);
      setStarterCode(problemData.starter_code || "");
      setHints(problemData.hints || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load problem"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  async function handleSaveProblem() {
    if (!id || !title.trim()) return;
    try {
      setSaving(true);
      setSaveSuccess(false);
      const updated = await updateProblem(Number(id), {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        starter_code: starterCode,
        hints: hints.trim(),
      });
      setProblem(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save problem"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTestCase() {
    if (!id) return;
    if (!tcInput.trim() && !tcExpectedOutput.trim()) {
      setTcError("Input and expected output are required");
      return;
    }
    try {
      setAddingTestCase(true);
      setTcError(null);
      await addTestCase(Number(id), {
        input: tcInput,
        expected_output: tcExpectedOutput,
        is_sample: tcIsSample,
      });
      setTestCaseDialogOpen(false);
      setTcInput("");
      setTcExpectedOutput("");
      setTcIsSample(true);
      // Reload problem to get updated test cases
      const updated = await getProblem(Number(id));
      setProblem(updated);
    } catch (err) {
      setTcError(
        err instanceof Error ? err.message : "Failed to add test case"
      );
    } finally {
      setAddingTestCase(false);
    }
  }

  function openEditTestCase(tc: TestCaseData) {
    setEditingTc(tc);
    setEditTcInput(tc.input);
    setEditTcExpectedOutput(tc.expected_output);
    setEditTcIsSample(tc.is_sample);
    setEditTcError(null);
    setEditDialogOpen(true);
  }

  async function handleUpdateTestCase() {
    if (!editingTc || !id) return;
    try {
      setUpdatingTc(true);
      setEditTcError(null);
      await updateTestCase(editingTc.id, {
        input: editTcInput,
        expected_output: editTcExpectedOutput,
        is_sample: editTcIsSample,
      });
      setEditDialogOpen(false);
      setEditingTc(null);
      const updated = await getProblem(Number(id));
      setProblem(updated);
    } catch (err) {
      setEditTcError(
        err instanceof Error ? err.message : "Failed to update test case"
      );
    } finally {
      setUpdatingTc(false);
    }
  }

  async function handleDeleteTestCase(tcId: number) {
    if (!id) return;
    try {
      setDeletingTcId(tcId);
      await deleteTestCase(tcId);
      const updated = await getProblem(Number(id));
      setProblem(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete test case"
      );
    } finally {
      setDeletingTcId(null);
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

  if (error && !problem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!problem) return null;

  const testCases: TestCaseData[] = problem.test_cases ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="mt-1"
          onClick={() => navigate(`/teacher/exams/${problem.exam_id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Problem Editor
          </h1>
          <p className="mt-1 text-muted-foreground">
            Edit problem details and manage test cases.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Problem Details */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pencil className="h-5 w-5 text-primary" />
            Problem Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prob-title">Title</Label>
              <Input
                id="prob-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prob-difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="prob-desc">Description</Label>
            <Textarea
              id="prob-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prob-hints" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              Hints
            </Label>
            <Textarea
              id="prob-hints"
              placeholder="Add hints for students (one per line)..."
              value={hints}
              onChange={(e) => setHints(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prob-starter" className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              Starter Code
            </Label>
            <Textarea
              id="prob-starter"
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              placeholder="function solution() {&#10;  // write your code here&#10;}"
            />
          </div>
          <Button
            onClick={handleSaveProblem}
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
            {saveSuccess ? "Saved!" : "Save Problem"}
          </Button>
        </CardContent>
      </Card>

      {/* Test Cases */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="h-5 w-5 text-primary" />
                Test Cases
              </CardTitle>
              <CardDescription>
                {testCases.length} test case{testCases.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>

            <Dialog
              open={testCaseDialogOpen}
              onOpenChange={setTestCaseDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Test Case
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Test Case</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="tc-input">Input</Label>
                    <Textarea
                      id="tc-input"
                      placeholder="Test input..."
                      value={tcInput}
                      onChange={(e) => setTcInput(e.target.value)}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tc-expected">Expected Output</Label>
                    <Textarea
                      id="tc-expected"
                      placeholder="Expected output..."
                      value={tcExpectedOutput}
                      onChange={(e) => setTcExpectedOutput(e.target.value)}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        Sample Test Case
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Visible to students during the exam
                      </p>
                    </div>
                    <Switch
                      checked={tcIsSample}
                      onCheckedChange={setTcIsSample}
                    />
                  </div>
                  {tcError && (
                    <p className="text-sm text-destructive">{tcError}</p>
                  )}
                  <Button
                    onClick={handleAddTestCase}
                    disabled={addingTestCase}
                    className="w-full gap-2"
                  >
                    {addingTestCase && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Add Test Case
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {testCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <FlaskConical className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                No test cases yet. Add test cases to validate student
                submissions.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Expected Output</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testCases.map((tc, index) => (
                  <TableRow key={tc.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-secondary rounded px-1.5 py-0.5 line-clamp-2">
                        {tc.input}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-secondary rounded px-1.5 py-0.5 line-clamp-2">
                        {tc.expected_output}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          tc.is_sample
                            ? "bg-green-500/15 text-green-500 border-green-500/30"
                            : "bg-secondary text-muted-foreground border-border/50"
                        }
                      >
                        {tc.is_sample ? "Sample" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-primary"
                          onClick={() => openEditTestCase(tc)}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive"
                          disabled={deletingTcId === tc.id}
                          onClick={() => handleDeleteTestCase(tc.id)}
                        >
                          {deletingTcId === tc.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Delete
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

      {/* Edit Test Case Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Test Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-tc-input">Input</Label>
              <Textarea
                id="edit-tc-input"
                value={editTcInput}
                onChange={(e) => setEditTcInput(e.target.value)}
                rows={3}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tc-expected">Expected Output</Label>
              <Textarea
                id="edit-tc-expected"
                value={editTcExpectedOutput}
                onChange={(e) => setEditTcExpectedOutput(e.target.value)}
                rows={3}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">
                  Sample Test Case
                </p>
                <p className="text-xs text-muted-foreground">
                  Visible to students during the exam
                </p>
              </div>
              <Switch
                checked={editTcIsSample}
                onCheckedChange={setEditTcIsSample}
              />
            </div>
            {editTcError && (
              <p className="text-sm text-destructive">{editTcError}</p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTestCase}
                disabled={updatingTc}
                className="gap-2"
              >
                {updatingTc && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
