import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Save, CalendarIcon, Search, CheckSquare, FileText, Code2, ArrowLeft, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/hooks/useClasses";
import { useCreateExam, useAssignExam, useExam, useUpdateExam } from "@/hooks/useExams";
import { useAllProblems, useAddProblem } from "@/hooks/useProblems";
import { addTestCase, deleteProblem } from "@/lib/api";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import type { Question, QuestionType, MCQQuestion, WrittenQuestion, CodingQuestion } from "@/features/exams/types/exam";
import QuestionTypeDialog from "@/features/exams/components/QuestionTypeDialog";
import QuestionList from "@/features/exams/components/QuestionList";
import MCQEditor from "@/features/exams/components/MCQEditor";
import WrittenEditor from "@/features/exams/components/WrittenEditor";
import CodingEditorComponent from "@/features/exams/components/CodingEditor";

const typeIcons: Record<string, React.ElementType> = {
  mcq: CheckSquare,
  written: FileText,
  coding: Code2,
};

function createQuestion(type: QuestionType): Question {
  const base = { id: crypto.randomUUID(), points: 10, difficulty: "medium" as const, text: "", imageUrl: "" };
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

function bankProblemToQuestion(p: any): Question {
  const base = { id: crypto.randomUUID(), points: p.points || 10, difficulty: (p.difficulty || "medium") as "easy" | "medium" | "hard", text: p.title || p.text || "", imageUrl: "" };
  const type = p.type || "coding";
  switch (type) {
    case "mcq": {
      const opts = Array.isArray(p.options) ? p.options : (typeof p.options === "string" ? JSON.parse(p.options || "[]") : []);
      return {
        ...base, type: "mcq",
        options: opts.length > 0 ? opts.map((o: any, i: number) => ({ id: o.id || String(i), text: o.text || o })) : [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }],
        correctOptionIds: Array.isArray(p.correct_option_ids) ? p.correct_option_ids : [],
        multipleCorrect: p.multiple_correct || false,
        explanation: p.explanation || "",
      } as MCQQuestion;
    }
    case "written":
      return { ...base, type: "written", maxWordCount: p.max_word_count || 500, rubric: p.rubric || "", requireManualGrading: true } as WrittenQuestion;
    default:
      return {
        ...base, type: "coding", description: p.description || "",
        starterCode: { python: p.starter_code || "", javascript: p.starter_code || "" },
        testCases: (p.test_cases || []).map((tc: any) => ({ id: String(tc.id), input: tc.input, expectedOutput: tc.expected_output, isSample: tc.is_sample })),
        hints: p.hints || "", timeLimitMs: p.time_limit_ms || 2000, memoryLimitKb: p.memory_limit_kb || 262144,
      } as CodingQuestion;
  }
}

export default function ExamBuilder() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const editExam = (location.state as any)?.editExam;
  const editId: number = editExam?.id || 0;
  const isEditing = !!editId;

  // Real API hooks
  const { data: classes, isLoading: classesLoading, error: classesError, refetch: refetchClasses } = useClasses();
  const { data: bankProblems } = useAllProblems();
  const { data: examData } = useExam(editId);
  const createExamMutation = useCreateExam();
  const updateExamMutation = useUpdateExam();
  const assignExamMutation = useAssignExam();
  const addProblemMutation = useAddProblem();

  const [title, setTitle] = useState(editExam?.title || "");
  const [description, setDescription] = useState(editExam?.description || "");
  const [duration, setDuration] = useState(editExam?.duration || 60);
  const [passingScore, setPassingScore] = useState(50);
  const [shuffle, setShuffle] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [assignedCourse, setAssignedCourse] = useState("");
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankTypeFilter, setBankTypeFilter] = useState<string>("all");
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isEditing || hydrated || !examData) return;
    setTitle(examData.title || "");
    setDescription(examData.description || "");
    setDuration(examData.duration_minutes || 60);
    setPassingScore(examData.passing_score ?? 50);
    setShuffle(!!examData.shuffle_questions);
    setShowResults(examData.show_results_after !== false);
    if (examData.start_time) {
      const d = new Date(examData.start_time);
      setStartDate(d);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setStartTime(`${hh}:${mm}`);
    }
    const ecs = examData.exam_classes || examData.ExamClasses || [];
    if (ecs.length > 0) {
      const cid = ecs[0].class_id ?? ecs[0].ClassID ?? ecs[0].Class?.ID;
      if (cid) setAssignedCourse(String(cid));
    }
    const problems = examData.problems || examData.Problems || [];
    setQuestions(problems.map(bankProblemToQuestion));
    setHydrated(true);
  }, [examData, isEditing, hydrated]);

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
    if (!assignedCourse) {
      toast({ title: "Validation error", description: "Please assign the exam to a course.", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(Number(assignedCourse)) || Number(assignedCourse) <= 0) {
      toast({ title: "Validation error", description: "Invalid course selection.", variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "Validation error", description: "Add at least one question.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Build start/end times
      let startTimeISO: string | undefined;
      let endTimeISO: string | undefined;
      if (startDate) {
        const [h, m] = startTime.split(":").map(Number);
        const start = new Date(startDate);
        start.setHours(h, m, 0, 0);
        startTimeISO = start.toISOString();
        const end = new Date(start.getTime() + duration * 60 * 1000);
        endTimeISO = end.toISOString();
      }

      // 1. Create or update exam
      let exam: any;
      if (isEditing) {
        exam = await updateExamMutation.mutateAsync({
          id: editId,
          data: {
            title,
            description,
            duration_minutes: duration,
            start_time: startTimeISO,
            end_time: endTimeISO,
            shuffle_questions: shuffle,
            show_results_after: showResults,
            passing_score: passingScore,
          },
        });
        exam.id = editId;
        // Remove existing problems (simple replace strategy)
        const existing = examData?.problems || examData?.Problems || [];
        for (const p of existing) {
          try { await deleteProblem(p.id ?? p.ID); } catch {}
        }
      } else {
        exam = await createExamMutation.mutateAsync({
          title,
          description,
          duration_minutes: duration,
          start_time: startTimeISO,
          end_time: endTimeISO,
          shuffle_questions: shuffle,
          show_results_after: showResults,
          passing_score: passingScore,
        });
      }

      // 2. Add each question as a problem
      for (const q of questions) {
        const problemData: any = {
          title: q.text,
          description: q.text,
          type: q.type,
          points: q.points,
          difficulty: q.difficulty,
        };

        if (q.type === "mcq") {
          const mcq = q as MCQQuestion;
          problemData.options = JSON.stringify(mcq.options);
          problemData.correct_option_ids = JSON.stringify(mcq.correctOptionIds);
          problemData.multiple_correct = mcq.multipleCorrect;
          problemData.explanation = mcq.explanation;
        } else if (q.type === "written") {
          const w = q as WrittenQuestion;
          problemData.max_word_count = w.maxWordCount;
          problemData.rubric = w.rubric;
          problemData.require_manual_grading = w.requireManualGrading;
        } else {
          const c = q as CodingQuestion;
          problemData.description = c.description || q.text;
          problemData.starter_code = c.starterCode?.python || c.starterCode?.javascript || "";
          problemData.hints = c.hints;
          problemData.time_limit_ms = c.timeLimitMs;
          problemData.memory_limit_kb = c.memoryLimitKb;
        }

        const createdProblem = await addProblemMutation.mutateAsync({ examId: exam.id, data: problemData });

        // Add test cases for coding problems
        if (q.type === "coding") {
          const c = q as CodingQuestion;
          const validTCs = c.testCases.filter(
            (tc) => tc.input.trim() !== "" && tc.expectedOutput.trim() !== ""
          );
          for (let i = 0; i < validTCs.length; i++) {
            const tc = validTCs[i];
            await addTestCase(createdProblem.id, {
              input: tc.input,
              expected_output: tc.expectedOutput,
              is_sample: tc.isSample,
              order_index: i,
            });
          }
        }
      }

      // 3. Assign to class
      const classId = Number(assignedCourse);
      if (classId) {
        await assignExamMutation.mutateAsync({ id: exam.id, classIds: [classId] });
      }

      toast({ title: isEditing ? "Exam updated!" : "Exam saved!", description: `"${title}" with ${questions.length} question(s) ${isEditing ? "updated" : "created"} successfully.` });
      navigate("/dashboard/exams");
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Bank import logic -- now from real API
  const allBankProblems = bankProblems || [];
  const filteredBankProblems = allBankProblems.filter((p: any) => {
    const matchesSearch = (p.title || "").toLowerCase().includes(bankSearch.toLowerCase()) || (p.description || "").toLowerCase().includes(bankSearch.toLowerCase());
    const matchesType = bankTypeFilter === "all" || p.type === bankTypeFilter;
    return matchesSearch && matchesType;
  });

  const toggleBankSelection = (id: string) => {
    setSelectedBankIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const importFromBank = () => {
    const toImport = allBankProblems.filter((p: any) => selectedBankIds.has(String(p.id)));
    const newQuestions = toImport.map(bankProblemToQuestion);
    setQuestions((prev) => [...prev, ...newQuestions]);
    setSelectedIdx(questions.length);
    setBankDialogOpen(false);
    setSelectedBankIds(new Set());
    setBankSearch("");
    setBankTypeFilter("all");
    toast({ title: "Imported", description: `${newQuestions.length} question(s) imported from the bank.` });
  };

  const handleSaveToBank = () => {
    toast({ title: "Info", description: "Questions are saved to the bank when you save the exam." });
  };

  if (classesLoading) return <PageSkeleton rows={3} cards={4} />;
  if (classesError) return <ErrorState message="Failed to load classes" onRetry={refetchClasses} />;

  const courseList = (classes || []).map((c: any) => ({ id: String(c.id), name: c.name + (c.section ? ` \u2014 ${c.section}` : "") }));
  const selected = questions[selectedIdx];

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEditing && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isEditing ? "Edit Exam" : "Exam Builder"}
          </h1>
        </div>
        <Button className="gap-2 rounded-full" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : isEditing ? "Update Exam" : "Save Exam"}
        </Button>
      </div>

      {/* Exam settings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg border border-border/50 bg-card/80 backdrop-blur-md p-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam title" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Assign to Course</label>
          <Select value={assignedCourse} onValueChange={setAssignedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courseList.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Duration (min)</label>
          <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Passing Score (%)</label>
          <Input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} min={0} max={100} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Time</label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
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
            onImportFromBank={() => setBankDialogOpen(true)}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} minSize={40}>
          {selected ? (
            selected.type === "mcq" ? (
              <MCQEditor question={selected as MCQQuestion} onChange={updateQuestion} onSaveToBank={handleSaveToBank} />
            ) : selected.type === "written" ? (
              <WrittenEditor question={selected as WrittenQuestion} onChange={updateQuestion} onSaveToBank={handleSaveToBank} />
            ) : (
              <CodingEditorComponent question={selected as CodingQuestion} onChange={updateQuestion} onSaveToBank={handleSaveToBank} />
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
            <AlertDialogDescription>This will permanently remove this question from the exam.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import from Question Bank Dialog */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import from Question Bank</DialogTitle>
            <DialogDescription>
              {assignedCourse
                ? `Showing questions for ${courseList.find((c: any) => c.id === assignedCourse)?.name || assignedCourse}. Select questions to import.`
                : "Select a course first in the exam settings to filter questions, or browse all."}
            </DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search questions or tags..." className="pl-9" value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} />
            </div>
            <Select value={bankTypeFilter} onValueChange={setBankTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mcq">MCQ</SelectItem>
                <SelectItem value="written">Written</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question list */}
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {filteredBankProblems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No questions found.</p>
              </div>
            ) : (
              filteredBankProblems.map((p: any) => {
                const Icon = typeIcons[p.type] || Code2;
                const isSelected = selectedBankIds.has(String(p.id));
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                    )}
                    onClick={() => toggleBankSelection(String(p.id))}
                  >
                    <Checkbox checked={isSelected} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground uppercase">{p.type}</span>
                        <span className="text-xs text-muted-foreground">{p.points} pts</span>
                        <Badge variant="secondary" className="text-[10px] ml-auto">{p.difficulty}</Badge>
                      </div>
                      <p className="text-sm text-foreground">{p.title || p.text}</p>
                      {Array.isArray(p.tags) && p.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {p.tags.map((t: string) => (
                            <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="border-t border-border/50 pt-3">
            <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
              {selectedBankIds.size > 0 && <span>{selectedBankIds.size} selected</span>}
            </div>
            <Button variant="outline" onClick={() => { setBankDialogOpen(false); setSelectedBankIds(new Set()); }}>Cancel</Button>
            <Button onClick={importFromBank} disabled={selectedBankIds.size === 0}>
              Import {selectedBankIds.size > 0 ? `(${selectedBankIds.size})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
