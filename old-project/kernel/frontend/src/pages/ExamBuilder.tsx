import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Question, QuestionType, MCQQuestion, WrittenQuestion, CodingQuestion } from "@/types/exam";
import { createExam, addProblem, addTestCase } from "@/lib/api";
import { questionToBackendProblem } from "@/lib/mappers";
import QuestionTypeDialog from "@/components/exam-builder/QuestionTypeDialog";
import QuestionList from "@/components/exam-builder/QuestionList";
import MCQEditor from "@/components/exam-builder/MCQEditor";
import WrittenEditor from "@/components/exam-builder/WrittenEditor";
import CodingEditorComponent from "@/components/exam-builder/CodingEditor";

function createQuestion(type: QuestionType): Question {
  const base = { id: crypto.randomUUID(), points: 10, difficulty: "medium" as const, text: "" };
  switch (type) {
    case "mcq":
      return {
        ...base, type: "mcq",
        options: [
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
        ],
        correctOptionIds: [],
        multipleCorrect: false,
        explanation: "",
      } as MCQQuestion;
    case "written":
      return { ...base, type: "written", maxWordCount: 500, rubric: "", requireManualGrading: true } as WrittenQuestion;
    case "coding":
      return {
        ...base, type: "coding", description: "",
        starterCode: { python: "", javascript: "", c: "", cpp: "" },
        testCases: [], hints: "", timeLimitMs: 2000, memoryLimitKb: 262144,
      } as CodingQuestion;
  }
}

export default function ExamBuilder() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [passingScore, setPassingScore] = useState(50);
  const [shuffle, setShuffle] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  const addQuestion = (type: QuestionType) => {
    const q = createQuestion(type);
    setQuestions((prev) => [...prev, q]);
    setSelectedIdx(questions.length);
  };

  const confirmDelete = () => {
    if (deleteIdx !== null) {
      setQuestions((prev) => prev.filter((_, i) => i !== deleteIdx));
      setSelectedIdx((prev) => Math.max(0, prev >= deleteIdx ? prev - 1 : prev));
      setDeleteIdx(null);
    }
  };

  const updateQuestion = (q: Question) => {
    setQuestions((prev) => prev.map((old, i) => (i === selectedIdx ? q : old)));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Validation error", description: "Please enter an exam title.", variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "Validation error", description: "Add at least one question.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const exam = await createExam({
        title,
        description,
        duration_minutes: duration,
        passing_score: passingScore,
        shuffle_questions: shuffle,
        show_results_after: showResults,
      });
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const problemData = questionToBackendProblem(q, i);
        const problem = await addProblem(exam.id, problemData);
        if (q.type === "coding") {
          const coding = q as CodingQuestion;
          for (const tc of coding.testCases) {
            await addTestCase(problem.id, {
              input: tc.input,
              expected_output: tc.expectedOutput,
              is_sample: tc.isSample,
            });
          }
        }
      }
      toast({ title: "Exam saved!", description: `"${title}" with ${questions.length} question(s) has been saved.` });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selected = questions[selectedIdx];

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Exam Builder</h1>
        <Button className="gap-2 rounded-full" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Exam"}
        </Button>
      </div>

      {/* Exam settings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg border border-border/50 bg-card/80 backdrop-blur-md p-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam title" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Duration (min)</label>
          <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Passing Score (%)</label>
          <Input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} min={0} max={100} />
        </div>
        <div className="flex flex-col gap-2 justify-center">
          <div className="flex items-center gap-2">
            <Switch checked={shuffle} onCheckedChange={setShuffle} />
            <span className="text-xs text-muted-foreground">Shuffle</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={showResults} onCheckedChange={setShowResults} />
            <span className="text-xs text-muted-foreground">Show Results</span>
          </div>
        </div>
        <div className="col-span-2 md:col-span-4">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Exam description..." rows={2} />
        </div>
      </div>

      {/* Split layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-xl border border-border/50 overflow-hidden bg-card/60 backdrop-blur-sm">
        <ResizablePanel defaultSize={30} minSize={20}>
          <QuestionList
            questions={questions}
            selectedIndex={selectedIdx}
            onSelect={setSelectedIdx}
            onAdd={() => setTypeDialogOpen(true)}
            onDelete={(idx) => setDeleteIdx(idx)}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} minSize={40}>
          {selected ? (
            selected.type === "mcq" ? (
              <MCQEditor question={selected as MCQQuestion} onChange={updateQuestion} />
            ) : selected.type === "written" ? (
              <WrittenEditor question={selected as WrittenQuestion} onChange={updateQuestion} />
            ) : (
              <CodingEditorComponent question={selected as CodingQuestion} onChange={updateQuestion} />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Add a question to get started
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <QuestionTypeDialog open={typeDialogOpen} onClose={() => setTypeDialogOpen(false)} onSelect={addQuestion} />

      {/* Delete confirmation */}
      <AlertDialog open={deleteIdx !== null} onOpenChange={() => setDeleteIdx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this question from the exam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
