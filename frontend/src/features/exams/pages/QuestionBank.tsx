import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Plus, Search, FileText, CheckSquare, Code2, Trash2, Pencil,
  ChevronRight, ArrowLeft, Library, FolderOpen, FolderPlus, MoreVertical,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder } from "@/hooks/useFolders";
import { useAllProblems, useDeleteProblem } from "@/hooks/useProblems";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

const typeIcons: Record<string, React.ElementType> = { mcq: CheckSquare, written: FileText, coding: Code2 };
const typeLabels: Record<string, string> = { mcq: "MCQ", written: "Written", coding: "Coding" };

export default function QuestionBank() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: problems, isLoading, error, refetch } = useAllProblems();
  const { data: folders } = useFolders();
  const deleteProblemMutation = useDeleteProblem();
  const createFolderMutation = useCreateFolder();

  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState<number | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  
  const [deleteFolderId, setDeleteFolderId] = useState<number | null>(null);
  
  const updateFolderMutation = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();

  const allProblems = problems || [];

  const parseTags = (tags: any): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try { const parsed = JSON.parse(tags); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  };

  const allTags = useMemo(
    () => Array.from(new Set(allProblems.flatMap((p: any) => parseTags(p.tags)))).sort(),
    [allProblems]
  );

  const folderMap = useMemo(() => {
    const m = new Map<number, string>();
    (folders || []).forEach((c: any) => m.set(c.id, c.name));
    return m;
  }, [folders]);

  const getFolderForProblem = (p: any): { id: number | null; name: string } => {
    if (!p.folder_id || !folderMap.has(p.folder_id)) return { id: null, name: "Unassigned" };
    return { id: p.folder_id, name: folderMap.get(p.folder_id)! };
  };

  const filteredProblems = useMemo(() => {
    return allProblems.filter((p: any) => {
      const matchesSearch = (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || p.type === typeFilter;
      const matchesTag = !tagFilter || parseTags(p.tags).includes(tagFilter);
      const folderId = p.folder_id && folderMap.has(p.folder_id) ? p.folder_id : null;
      if (!selectedCourseFilter || selectedCourseFilter === "all") return matchesSearch && matchesType && matchesTag;
      if (selectedCourseFilter === "unassigned") {
        return matchesSearch && matchesType && matchesTag && folderId === null;
      }
      return matchesSearch && matchesType && matchesTag && folderId === Number(selectedCourseFilter);
    });
  }, [allProblems, searchQuery, typeFilter, tagFilter, selectedCourseFilter, folderMap]);

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

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolderMutation.mutateAsync({ name: newFolderName.trim() });
      toast({ title: "Folder created" });
      setFolderDialogOpen(false);
      setNewFolderName("");
    } catch (err: any) {
      toast({ title: "Failed to create folder", description: err.message, variant: "destructive" });
    }
  };

  const handleRenameFolder = async () => {
    if (!renameFolderName.trim() || renameFolderId === null) return;
    try {
      await updateFolderMutation.mutateAsync({ id: renameFolderId, name: renameFolderName.trim() });
      toast({ title: "Folder renamed" });
      setRenameDialogOpen(false);
      setRenameFolderId(null);
      setRenameFolderName("");
    } catch (err: any) {
      toast({ title: "Failed to rename folder", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteFolder = async () => {
    if (deleteFolderId === null) return;
    try {
      await deleteFolderMutation.mutateAsync(deleteFolderId);
      toast({ title: "Folder deleted" });
    } catch (err: any) {
      toast({ title: "Failed to delete folder", description: err.message, variant: "destructive" });
    }
    setDeleteFolderId(null);
  };

  const toggleBulk = (id: number) => {
    setBulkSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleAllBulk = () => {
    if (bulkSelected.size === filteredProblems.length) setBulkSelected(new Set());
    else setBulkSelected(new Set(filteredProblems.map((q: any) => q.id)));
  };

  const courseGroups = useMemo(() => {
    const groups = new Map<string, { id: number | null; name: string; problems: any[] }>();
    (folders || []).forEach((c: any) => {
      groups.set(String(c.id), { id: c.id, name: c.name, problems: [] });
    });
    allProblems.forEach((p: any) => {
      const id = p.folder_id && folderMap.has(p.folder_id) ? p.folder_id : null;
      const name = id != null ? folderMap.get(id)! : "Unassigned";
      const key = id != null ? String(id) : "unassigned";
      const existing = groups.get(key);
      if (existing) existing.problems.push(p);
      else groups.set(key, { id, name, problems: [p] });
    });
    return groups;
  }, [folders, allProblems, folderMap]);

  if (isLoading) return <PageSkeleton rows={5} cards={3} />;
  if (error) return <ErrorState message="Failed to load questions" onRetry={refetch} />;

  const headerTitle = selectedCourseFilter === "all"
    ? "All Questions"
    : selectedCourseFilter === "unassigned"
      ? "Unassigned"
      : folderMap.get(Number(selectedCourseFilter)) || `Folder #${selectedCourseFilter}`;

  return (
    <>
      {!selectedCourseFilter ? (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Library className="h-6 w-6 text-primary" />
              Question Bank
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and organize questions by folder.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setFolderDialogOpen(true)}>
              <FolderPlus className="h-4 w-4" /> New Folder
            </Button>
            <Button className="gap-2" onClick={() => navigate("/dashboard/question-bank/new")}>
              <Plus className="h-4 w-4" /> Add Question
            </Button>
          </div>
        </div>

        {courseGroups.size === 0 ? (
          <EmptyState icon={Library} title="No questions yet" description="Add a question to your bank to get started." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(courseGroups.entries()).map(([key, group]) => {
              const mcqCount = group.problems.filter((p) => p.type === "mcq").length;
              const writtenCount = group.problems.filter((p) => p.type === "written").length;
              const codingCount = group.problems.filter((p) => p.type === "coding").length;
              return (
                <Card key={key} className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setSelectedCourseFilter(key)}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <FolderOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{group.name}</p>
                          <p className="text-xs text-muted-foreground">{group.problems.length} questions</p>
                        </div>
                      </div>
                      {group.id !== null ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  const gid = group.id;
                                  const gname = group.name;
                                  setTimeout(() => {
                                    setRenameFolderId(gid);
                                    setRenameFolderName(gname);
                                    setRenameDialogOpen(true);
                                  }, 0);
                                }}
                              >
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  const gid = group.id;
                                  setTimeout(() => setDeleteFolderId(gid), 0);
                                }}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
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
            <Card className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all border-dashed" onClick={() => setSelectedCourseFilter("all")}>
              <CardContent className="p-5 flex flex-col items-center justify-center h-full text-center gap-2">
                <Library className="h-8 w-8 text-muted-foreground" />
                <p className="font-semibold text-foreground">View All Questions</p>
                <p className="text-xs text-muted-foreground">{allProblems.length} total questions</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      ) : (
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedCourseFilter(""); setSearchQuery(""); setTypeFilter("all"); setTagFilter(""); setBulkSelected(new Set()); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{headerTitle}</h1>
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
        {allTags.length > 0 && (
          <Select value={tagFilter || "all"} onValueChange={(v) => setTagFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Filter tag" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
                  <TableHead>Tags</TableHead>
                  {selectedCourseFilter === "all" && <TableHead>Folder</TableHead>}
                  <TableHead>Points</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProblems.map((p: any) => {
                  const Icon = typeIcons[p.type] || Code2;
                  const course = getFolderForProblem(p);
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
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {parseTags(p.tags).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] cursor-pointer" onClick={(e) => { e.stopPropagation(); setTagFilter(tag); }}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      {selectedCourseFilter === "all" && (
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">{getFolderForProblem(p).name}</Badge>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{p.points}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{p.difficulty}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/dashboard/question-bank/${p.id}`)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
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
      </div>
      )}

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

      {/* New Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Create a folder to organize your questions independently from courses.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Data Structures, Algorithms..."
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || createFolderMutation.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Folder Name</Label>
              <Input
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameFolder} disabled={!renameFolderName.trim() || updateFolderMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <AlertDialog open={deleteFolderId !== null} onOpenChange={(v) => !v && setDeleteFolderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the folder. Any questions inside will automatically be moved to the "Unassigned" folder. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteFolderMutation.isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
