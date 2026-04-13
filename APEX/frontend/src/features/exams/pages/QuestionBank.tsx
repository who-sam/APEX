import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useClasses } from "@/hooks/useClasses";
import { useAllProblems, useUpdateProblem, useDeleteProblem } from "@/hooks/useProblems";
import { useExams } from "@/hooks/useExams";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import type { QuestionType } from "@/features/exams/types/exam";

const typeIcons: Record<string, React.ElementType> = { mcq: CheckSquare, written: FileText, coding: Code2 };
const typeLabels: Record<string, string> = { mcq: "MCQ", written: "Written", coding: "Coding" };

export default function QuestionBank() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: problems, isLoading, error, refetch } = useAllProblems();
  const { data: classes } = useClasses();
  const { data: exams } = useExams();
  const updateProblemMutation = useUpdateProblem();
  const deleteProblemMutation = useDeleteProblem();

  const [selectedExamFilter, setSelectedExamFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Form state
  const [formText, setFormText] = useState("");
  const [formType, setFormType] = useState<QuestionType>("mcq");
  const [formPoints, setFormPoints] = useState(10);
  const [formDifficulty, setFormDifficulty] = useState("medium");
  const [formDescription, setFormDescription] = useState("");

  const allProblems = problems || [];

  // Group by exam
  const examMap = new Map<number, string>();
  (exams || []).forEach((e: any) => examMap.set(e.id, e.title));

  const filteredProblems = allProblems.filter((p: any) => {
    const matchesSearch = (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    const matchesExam = !selectedExamFilter || String(p.exam_id) === selectedExamFilter;
    return matchesSearch && matchesType && matchesExam;
  });

  const openEdit = (p: any) => {
    setEditingProblem(p);
    setFormText(p.title || "");
    setFormType(p.type || "coding");
    setFormPoints(p.points || 10);
    setFormDifficulty(p.difficulty || "medium");
    setFormDescription(p.description || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formText.trim()) {
      toast({ title: "Missing fields", description: "Please fill in the question text.", variant: "destructive" });
      return;
    }
    try {
      await updateProblemMutation.mutateAsync({
        id: editingProblem.id,
        data: { title: formText, type: formType, points: formPoints, difficulty: formDifficulty, description: formDescription },
      });
      toast({ title: "Question updated" });
      setDialogOpen(false);
      setEditingProblem(null);
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (deleteId !== null) {
      try {
        await deleteProblemMutation.mutateAsync(deleteId);
        setBulkSelected((prev) => { const n = new Set(prev); n.delete(deleteId); return n; });
        toast({ title: "Question deleted" });
      } catch (err: any) {
        toast({ title: "Delete failed", description: err.message, variant: "destructive" });
      }
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of bulkSelected) {
        await deleteProblemMutation.mutateAsync(id);
      }
      toast({ title: "Questions deleted", description: `${bulkSelected.size} question(s) removed.` });
      setBulkSelected(new Set());
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
    setBulkDeleteOpen(false);
  };

  const toggleBulk = (id: number) => {
    setBulkSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleAllBulk = () => {
    if (bulkSelected.size === filteredProblems.length) setBulkSelected(new Set());
    else setBulkSelected(new Set(filteredProblems.map((q: any) => q.id)));
  };

  if (isLoading) return <PageSkeleton rows={5} cards={3} />;
  if (error) return <ErrorState message="Failed to load questions" onRetry={refetch} />;

  // No exam filter selected: show exam groupings
  if (!selectedExamFilter) {
    const examGroups = new Map<number, any[]>();
    allProblems.forEach((p: any) => {
      const group = examGroups.get(p.exam_id) || [];
      group.push(p);
      examGroups.set(p.exam_id, group);
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Library className="h-6 w-6 text-primary" />
              Question Bank
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and organize questions by exam.</p>
          </div>
          <Button className="gap-2" onClick={() => navigate("/dashboard/exam-builder")}>
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>

        {examGroups.size === 0 ? (
          <EmptyState icon={Library} title="No questions yet" description="Create an exam with questions to see them here." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(examGroups.entries()).map(([examId, probs]) => {
              const mcqCount = probs.filter((p) => p.type === "mcq").length;
              const writtenCount = probs.filter((p) => p.type === "written").length;
              const codingCount = probs.filter((p) => p.type === "coding").length;
              return (
                <Card key={examId} className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setSelectedExamFilter(String(examId))}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{examMap.get(examId) || `Exam #${examId}`}</p>
                          <p className="text-xs text-muted-foreground">{probs.length} questions</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{mcqCount} MCQ</span>
                      <span>{writtenCount} Written</span>
                      <span>{codingCount} Coding</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Card className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all border-dashed" onClick={() => setSelectedExamFilter("all")}>
              <CardContent className="p-5 flex flex-col items-center justify-center h-full text-center gap-2">
                <Library className="h-8 w-8 text-muted-foreground" />
                <p className="font-semibold text-foreground">View All Questions</p>
                <p className="text-xs text-muted-foreground">{allProblems.length} total questions</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Exam selected: show questions table
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedExamFilter(""); setSearchQuery(""); setTypeFilter("all"); setBulkSelected(new Set()); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedExamFilter === "all" ? "All Questions" : examMap.get(Number(selectedExamFilter)) || `Exam #${selectedExamFilter}`}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{filteredProblems.length} question(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {bulkSelected.size > 0 && (
            <Button variant="destructive" size="sm" className="gap-1" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete ({bulkSelected.size})
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search questions..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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

      <Card className="border-border/50 bg-card/80 backdrop-blur-md">
        <CardContent className="p-0">
          {filteredProblems.length === 0 ? (
            <EmptyState icon={FileText} title="No questions found" description="Try adjusting your filters." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={bulkSelected.size === filteredProblems.length && filteredProblems.length > 0} onCheckedChange={toggleAllBulk} />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Question</TableHead>
                  {selectedExamFilter === "all" && <TableHead>Exam</TableHead>}
                  <TableHead>Points</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProblems.map((p: any) => {
                  const Icon = typeIcons[p.type] || Code2;
                  return (
                    <TableRow key={p.id} className={bulkSelected.has(p.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox checked={bulkSelected.has(p.id)} onCheckedChange={() => toggleBulk(p.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{typeLabels[p.type] || p.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-foreground truncate">{p.title}</p>
                      </TableCell>
                      {selectedExamFilter === "all" && (
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">{examMap.get(p.exam_id) || `#${p.exam_id}`}</Badge>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{p.points}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{p.difficulty}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Duplicated", description: "Question duplicated." })}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(p.id)}>
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

      {/* Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditingProblem(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update the question details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Question Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as QuestionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">MCQ</SelectItem>
                    <SelectItem value="written">Written</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={formDifficulty} onValueChange={setFormDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={formText} onChange={(e) => setFormText(e.target.value)} placeholder="Question title..." />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Description..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Points</Label>
              <Input type="number" value={formPoints} onChange={(e) => setFormPoints(Number(e.target.value))} min={1} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingProblem(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formText.trim() || updateProblemMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete single */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this question.</AlertDialogDescription>
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
            <AlertDialogDescription>This will permanently remove the selected questions.</AlertDialogDescription>
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
