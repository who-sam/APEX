import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Search, BookOpen, FileText, CheckSquare, Code2, Trash2, Copy, Pencil,
  ChevronRight, ArrowLeft, Library, X,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getQuestions, addQuestion as addBankQ, updateQuestion as updateBankQ, deleteQuestion as deleteBankQ, deleteQuestions as deleteBankQs, type BankQuestion, type MCQData, type WrittenData, type CodingData } from "@/features/exams/lib/questionBankStore";
import type { QuestionType } from "@/features/exams/types/exam";

/* ── Mock data ── */
const mockCourses = [
  { id: "APX-CS101", name: "CS101 — Intro to Programming" },
  { id: "APX-CS201", name: "CS201 — Data Structures" },
  { id: "APX-CS301", name: "CS301 — Algorithms" },
];




const typeIcons: Record<QuestionType, React.ElementType> = { mcq: CheckSquare, written: FileText, coding: Code2 };
const typeLabels: Record<QuestionType, string> = { mcq: "MCQ", written: "Written", coding: "Coding" };

// Default form state
function emptyForm(): {
  type: QuestionType; text: string; points: number; courseId: string; tags: string;
  mcqOptions: string[]; mcqCorrect: number[]; mcqExplanation: string;
  writtenRubric: string; writtenMaxWords: number;
  codingDescription: string; codingStarter: string; codingHints: string;
} {
  return {
    type: "mcq", text: "", points: 10, courseId: "", tags: "",
    mcqOptions: ["", "", "", ""], mcqCorrect: [], mcqExplanation: "",
    writtenRubric: "", writtenMaxWords: 500,
    codingDescription: "", codingStarter: "", codingHints: "",
  };
}

function formFromQuestion(q: BankQuestion) {
  return {
    type: q.type, text: q.text, points: q.points, courseId: q.courseId,
    tags: q.tags.join(", "),
    mcqOptions: q.mcqData?.options || ["", "", "", ""],
    mcqCorrect: q.mcqData?.correctIndices || [],
    mcqExplanation: q.mcqData?.explanation || "",
    writtenRubric: q.writtenData?.rubric || "",
    writtenMaxWords: q.writtenData?.maxWordCount || 500,
    codingDescription: q.codingData?.description || "",
    codingStarter: q.codingData?.starterCode || "",
    codingHints: q.codingData?.hints || "",
  };
}

export default function QuestionBank() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<BankQuestion[]>(() => getQuestions());
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const courseQuestions = selectedCourse && selectedCourse !== "all"
    ? questions.filter((q) => q.courseId === selectedCourse)
    : questions;

  const allTags = [...new Set(courseQuestions.flatMap((q) => q.tags))].sort();

  const filtered = courseQuestions.filter((q) => {
    const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "all" || q.type === typeFilter;
    const matchesTag = !tagFilter || q.tags.includes(tagFilter);
    return matchesSearch && matchesType && matchesTag;
  });

  const openAdd = (courseId?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm(), courseId: courseId || "" });
    setDialogOpen(true);
  };

  const openEdit = (q: BankQuestion) => {
    setEditingId(q.id);
    setForm(formFromQuestion(q));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.text.trim() || !form.courseId) {
      toast({ title: "Missing fields", description: "Please fill in question text and assign a course.", variant: "destructive" });
      return;
    }
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const base = {
      type: form.type, text: form.text.trim(), points: form.points,
      courseId: form.courseId, tags,
    };
    const extras: Partial<BankQuestion> = {};
    if (form.type === "mcq") {
      extras.mcqData = { options: form.mcqOptions.filter(Boolean), correctIndices: form.mcqCorrect, explanation: form.mcqExplanation };
    } else if (form.type === "written") {
      extras.writtenData = { rubric: form.writtenRubric, maxWordCount: form.writtenMaxWords };
    } else {
      extras.codingData = { description: form.codingDescription, starterCode: form.codingStarter, hints: form.codingHints };
    }

    if (editingId) {
      const updated = updateBankQ(editingId, { ...base, ...extras });
      setQuestions(updated);
      toast({ title: "Question updated" });
    } else {
      const newQ: BankQuestion = {
        id: `qb-${crypto.randomUUID().slice(0, 8)}`,
        ...base, ...extras,
        createdAt: new Date().toISOString().slice(0, 10),
      } as BankQuestion;
      const updated = addBankQ(newQ);
      setQuestions(updated);
      toast({ title: "Question added" });
    }
    setDialogOpen(false);
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      const updated = deleteBankQ(deleteId);
      setQuestions(updated);
      setDeleteId(null);
      setBulkSelected((prev) => { const n = new Set(prev); n.delete(deleteId); return n; });
      toast({ title: "Question deleted" });
    }
  };

  const handleBulkDelete = () => {
    const updated = deleteBankQs(bulkSelected);
    setQuestions(updated);
    setBulkSelected(new Set());
    setBulkDeleteOpen(false);
    toast({ title: "Questions deleted", description: `${bulkSelected.size} question(s) removed.` });
  };

  const handleDuplicate = (q: BankQuestion) => {
    const dup: BankQuestion = { ...q, id: `qb-${crypto.randomUUID().slice(0, 8)}`, text: `${q.text} (Copy)`, createdAt: new Date().toISOString().slice(0, 10) };
    const updated = addBankQ(dup);
    setQuestions(updated);
    toast({ title: "Duplicated" });
  };

  const toggleBulk = (id: string) => {
    setBulkSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleAllBulk = () => {
    if (bulkSelected.size === filtered.length) setBulkSelected(new Set());
    else setBulkSelected(new Set(filtered.map((q) => q.id)));
  };

  const getCourseName = (id: string) => mockCourses.find((c) => c.id === id)?.name || id;

  // ── No course selected: show course grid ──
  if (!selectedCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Library className="h-6 w-6 text-primary" />
              Question Bank
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and organize questions by course.</p>
          </div>
          <Button className="gap-2" onClick={() => openAdd()}>
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCourses.map((c) => {
            const count = questions.filter((q) => q.courseId === c.id).length;
            const mcqCount = questions.filter((q) => q.courseId === c.id && q.type === "mcq").length;
            const writtenCount = questions.filter((q) => q.courseId === c.id && q.type === "written").length;
            const codingCount = questions.filter((q) => q.courseId === c.id && q.type === "coding").length;
            return (
              <Card key={c.id} className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setSelectedCourse(c.id)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{c.id}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">{count} questions</Badge>
                    <span>{mcqCount} MCQ</span>
                    <span>{writtenCount} Written</span>
                    <span>{codingCount} Coding</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Card className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all border-dashed" onClick={() => setSelectedCourse("all")}>
            <CardContent className="p-5 flex flex-col items-center justify-center h-full text-center gap-2">
              <Library className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold text-foreground">View All Questions</p>
              <p className="text-xs text-muted-foreground">{questions.length} total questions</p>
            </CardContent>
          </Card>
        </div>

        <QuestionFormDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingId(null); }} form={form} setForm={setForm} onSave={handleSave} isEditing={!!editingId} />
      </div>
    );
  }

  // ── Course selected: show questions table ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedCourse(""); setSearchQuery(""); setTypeFilter("all"); setTagFilter(""); setBulkSelected(new Set()); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedCourse === "all" ? "All Questions" : getCourseName(selectedCourse)}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} question(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {bulkSelected.size > 0 && (
            <Button variant="destructive" size="sm" className="gap-1" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete ({bulkSelected.size})
            </Button>
          )}
          <Button className="gap-2" onClick={() => openAdd(selectedCourse === "all" ? "" : selectedCourse)}>
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search questions or tags..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Filter type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="mcq">MCQ</SelectItem>
            <SelectItem value="written">Written</SelectItem>
            <SelectItem value="coding">Coding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tagFilter && (
            <Badge variant="default" className="text-xs cursor-pointer gap-1" onClick={() => setTagFilter("")}>
              {tagFilter} <X className="h-3 w-3" />
            </Badge>
          )}
          {allTags.filter((t) => t !== tagFilter).map((t) => (
            <Badge key={t} variant="outline" className="text-xs cursor-pointer hover:bg-primary/10" onClick={() => setTagFilter(t)}>
              {t}
            </Badge>
          ))}
        </div>
      )}

      {/* Questions table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-md">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">No questions found</p>
              <p className="text-sm mt-1">Try adjusting your filters or add a new question.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={bulkSelected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAllBulk} />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Question</TableHead>
                  {selectedCourse === "all" && <TableHead>Course</TableHead>}
                  <TableHead>Points</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((q) => {
                  const Icon = typeIcons[q.type];
                  return (
                    <TableRow key={q.id} className={bulkSelected.has(q.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox checked={bulkSelected.has(q.id)} onCheckedChange={() => toggleBulk(q.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{typeLabels[q.type]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-foreground truncate">{q.text}</p>
                      </TableCell>
                      {selectedCourse === "all" && (
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-mono">{q.courseId}</Badge>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{q.points}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {q.tags.slice(0, 2).map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] cursor-pointer" onClick={() => setTagFilter(t)}>{t}</Badge>
                          ))}
                          {q.tags.length > 2 && <Badge variant="outline" className="text-[10px]">+{q.tags.length - 2}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{q.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(q)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(q)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(q.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <QuestionFormDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditingId(null); }} form={form} setForm={setForm} onSave={handleSave} isEditing={!!editingId} />

      {/* Delete single */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this question from the bank.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bulkSelected.size} question(s)?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the selected questions from the bank.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Rich Question Form Dialog ── */
type FormState = ReturnType<typeof emptyForm>;

function QuestionFormDialog({
  open, onClose, form, setForm, onSave, isEditing,
}: {
  open: boolean;
  onClose: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSave: () => void;
  isEditing: boolean;
}) {
  const updateMCQOption = (idx: number, val: string) => {
    setForm((prev) => {
      const opts = [...prev.mcqOptions];
      opts[idx] = val;
      return { ...prev, mcqOptions: opts };
    });
  };

  const toggleCorrect = (idx: number) => {
    setForm((prev) => {
      const correct = prev.mcqCorrect.includes(idx)
        ? prev.mcqCorrect.filter((i) => i !== idx)
        : [...prev.mcqCorrect, idx];
      return { ...prev, mcqCorrect: correct };
    });
  };

  const addMCQOption = () => {
    setForm((prev) => ({ ...prev, mcqOptions: [...prev.mcqOptions, ""] }));
  };

  const removeMCQOption = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      mcqOptions: prev.mcqOptions.filter((_, i) => i !== idx),
      mcqCorrect: prev.mcqCorrect.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Question" : "Add Question to Bank"}</DialogTitle>
          <DialogDescription>{isEditing ? "Update the question details below." : "Create a new question and assign it to a course."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Type + Course */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Question Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((prev) => ({ ...prev, type: v as QuestionType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">MCQ</SelectItem>
                  <SelectItem value="written">Written</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={form.courseId} onValueChange={(v) => setForm((prev) => ({ ...prev, courseId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {mockCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-1.5">
            <Label>Question Text</Label>
            <Textarea placeholder="Enter the question..." value={form.text} onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))} rows={3} />
          </div>

          {/* Points + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Points</Label>
              <Input type="number" value={form.points} onChange={(e) => setForm((prev) => ({ ...prev, points: Number(e.target.value) }))} min={1} />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input placeholder="e.g. sorting, algorithms" value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} />
            </div>
          </div>

          {/* Type-specific fields */}
          {form.type === "mcq" && (
            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <Label className="text-sm font-semibold">MCQ Options</Label>
              <p className="text-xs text-muted-foreground">Check the box to mark correct answer(s).</p>
              {form.mcqOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Checkbox checked={form.mcqCorrect.includes(idx)} onCheckedChange={() => toggleCorrect(idx)} />
                  <Input placeholder={`Option ${idx + 1}`} value={opt} onChange={(e) => updateMCQOption(idx, e.target.value)} className="flex-1" />
                  {form.mcqOptions.length > 2 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMCQOption(idx)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMCQOption} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Option
              </Button>
              <div className="space-y-1.5 mt-2">
                <Label>Explanation (optional)</Label>
                <Textarea placeholder="Why is this the correct answer?" value={form.mcqExplanation} onChange={(e) => setForm((prev) => ({ ...prev, mcqExplanation: e.target.value }))} rows={2} />
              </div>
            </div>
          )}

          {form.type === "written" && (
            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <Label className="text-sm font-semibold">Written Question Details</Label>
              <div className="space-y-1.5">
                <Label>Grading Rubric</Label>
                <Textarea placeholder="Describe the grading criteria..." value={form.writtenRubric} onChange={(e) => setForm((prev) => ({ ...prev, writtenRubric: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Word Count</Label>
                <Input type="number" value={form.writtenMaxWords} onChange={(e) => setForm((prev) => ({ ...prev, writtenMaxWords: Number(e.target.value) }))} min={50} />
              </div>
            </div>
          )}

          {form.type === "coding" && (
            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <Label className="text-sm font-semibold">Coding Question Details</Label>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea placeholder="Full problem description..." value={form.codingDescription} onChange={(e) => setForm((prev) => ({ ...prev, codingDescription: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Starter Code</Label>
                <Textarea placeholder="def solution():\n    pass" value={form.codingStarter} onChange={(e) => setForm((prev) => ({ ...prev, codingStarter: e.target.value }))} rows={4} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Hints (optional)</Label>
                <Input placeholder="e.g. Use dynamic programming" value={form.codingHints} onChange={(e) => setForm((prev) => ({ ...prev, codingHints: e.target.value }))} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={!form.text.trim() || !form.courseId}>
            {isEditing ? "Save Changes" : "Add Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
