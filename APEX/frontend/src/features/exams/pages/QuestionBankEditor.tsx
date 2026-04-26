import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/hooks/useFolders";
import { getProblem, saveProblemToBank, updateProblem, addTestCase, updateTestCase, deleteTestCase } from "@/lib/api";
import { createQuestion, bankProblemToQuestion } from "@/features/exams/lib/utils";
import { PageSkeleton } from "@/components/PageSkeleton";
import MCQEditor from "@/features/exams/components/MCQEditor";
import WrittenEditor from "@/features/exams/components/WrittenEditor";
import CodingEditorComponent from "@/features/exams/components/CodingEditor";
import QuestionTypeDialog from "@/features/exams/components/QuestionTypeDialog";
import type { Question, QuestionType, MCQQuestion, WrittenQuestion, CodingQuestion } from "@/features/exams/types/exam";

export default function QuestionBankEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: folders } = useFolders();

  const [question, setQuestion] = useState<Question | null>(null);
  const [folderId, setFolderId] = useState<string>("none");
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(!id);
  const [originalTestCaseIds, setOriginalTestCaseIds] = useState<number[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProblem(Number(id))
      .then((p: any) => {
        setQuestion(bankProblemToQuestion(p));
        setFolderId(p.folder_id ? String(p.folder_id) : "none");
        if (p.test_cases) {
          setOriginalTestCaseIds(p.test_cases.map((tc: any) => tc.id));
        }
      })
      .catch(() => {
        toast({ title: "Failed to load question", variant: "destructive" });
        navigate("/dashboard/question-bank");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleTypeSelect = (type: QuestionType) => {
    setQuestion(createQuestion(type));
    setTypeDialogOpen(false);
  };

  const handleSave = async () => {
    if (!question) return;
    if (question.type === "mcq" && (!(question as MCQQuestion).correctOptionIds || (question as MCQQuestion).correctOptionIds.length === 0)) {
      toast({ title: "Missing correct answer", description: "Select at least one correct option before saving.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data: any = {
        title: question.text || "Untitled",
        description: question.text || "",
        type: question.type,
        points: question.points,
        difficulty: question.difficulty,
        image_url: question.imageUrl || "",
        folder_id: folderId === "none" ? null : Number(folderId),
      };

      if (question.type === "mcq") {
        const mcq = question as MCQQuestion;
        data.options = JSON.stringify(mcq.options);
        data.correct_option_ids = JSON.stringify(mcq.correctOptionIds);
        data.multiple_correct = mcq.multipleCorrect;
        data.explanation = mcq.explanation;
      } else if (question.type === "written") {
        const w = question as WrittenQuestion;
        data.max_word_count = w.maxWordCount;
        data.rubric = w.rubric;
        data.require_manual_grading = w.requireManualGrading;
      } else {
        const c = question as CodingQuestion;
        data.description = c.description || question.text;
        data.starter_code = c.starterCode?.python || c.starterCode?.javascript || "";
        data.hints = c.hints;
        data.time_limit_ms = c.timeLimitMs;
        data.memory_limit_kb = c.memoryLimitKb;
      }

      if (id) {
        await updateProblem(Number(id), data);
        // Sync test cases for coding questions
        if (question.type === "coding") {
          const coding = question as CodingQuestion;
          // Delete removed test cases
          const currentIds = coding.testCases.filter(tc => !isNaN(Number(tc.id))).map(tc => Number(tc.id));
          for (const origId of originalTestCaseIds) {
            if (!currentIds.includes(origId)) {
              await deleteTestCase(origId);
            }
          }
          // Add new test cases (non-numeric ids) or update existing ones
          for (const tc of coding.testCases) {
            if (isNaN(Number(tc.id))) {
              await addTestCase(Number(id), { input: tc.input, expected_output: tc.expectedOutput, is_sample: tc.isSample, points: tc.points || 0 });
            } else {
              await updateTestCase(Number(tc.id), { input: tc.input, expected_output: tc.expectedOutput, is_sample: tc.isSample, points: tc.points || 0 });
            }
          }
        }
        toast({ title: "Question updated" });
      } else {
        const created: any = await saveProblemToBank(data);
        // Add test cases for new coding questions
        if (question.type === "coding" && created?.id) {
          const coding = question as CodingQuestion;
          for (const tc of coding.testCases) {
            await addTestCase(created.id, { input: tc.input, expected_output: tc.expectedOutput, is_sample: tc.isSample, points: tc.points || 0 });
          }
        }
        toast({ title: "Question saved to bank" });
      }
      navigate("/dashboard/question-bank");
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton rows={3} cards={2} />;

  // For new questions, show type picker first
  if (!question) {
    return (
      <QuestionTypeDialog
        open={typeDialogOpen}
        onClose={() => {
          if (!typeDialogOpen) return;
          navigate("/dashboard/question-bank");
        }}
        onSelect={handleTypeSelect}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/question-bank")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{id ? "Edit Question" : "New Question"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={folderId} onValueChange={setFolderId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select folder..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {(folders || []).map((c: any) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-card border rounded-lg p-6">
        {question.type === "mcq" && (
          <MCQEditor question={question as MCQQuestion} onChange={setQuestion} />
        )}
        {question.type === "written" && (
          <WrittenEditor question={question as WrittenQuestion} onChange={setQuestion} />
        )}
        {question.type === "coding" && (
          <CodingEditorComponent question={question as CodingQuestion} onChange={setQuestion} />
        )}
      </div>
    </div>
  );
}
