import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass, useStudentClasses, useJoinClass, useLeaveClass } from "@/hooks/useClasses";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import {
  BookOpen, Plus, Users, Upload, Copy, Check, Search, LogIn, LogOut,
  MoreHorizontal, Eye, Pencil, Trash2, ImagePlus, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import defaultCourseCover from "@/assets/default-course-cover.jpg";

/* ================================================================
   TEACHER VIEW
   ================================================================ */
function TeacherCourses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { data: classes, isLoading, error, refetch } = useClasses();
  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();
  const deleteClassMutation = useDeleteClass();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhoto, setEditPhoto] = useState<string | null>(null);

  // Open create dialog if navigated with state
  useEffect(() => {
    if ((location.state as any)?.openCreate) {
      setCreateOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNewPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createClassMutation.mutateAsync({ name: newName.trim(), section: newSection.trim() || undefined });
      if (newPhoto && created?.id) {
        await updateClassMutation.mutateAsync({ id: created.id, cover_image: newPhoto });
      }
      setNewName("");
      setNewSection("");
      setNewPhoto(null);
      setCreateOpen(false);
      toast({
        title: "Course created",
        description: created?.invite_code
          ? <span>Invite code: <strong>{created.invite_code}</strong> — share this with your students so they can enroll.</span>
          : "Course created successfully.",
      });
    } catch (err: any) {
      toast({ title: "Create failed", description: err.message, variant: "destructive" });
    }
  };

  const handleChangePhoto = (courseId: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await updateClassMutation.mutateAsync({ id: courseId, cover_image: dataUrl });
        toast({ title: "Cover photo updated" });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({ title: "Copied!", description: `Invite code ${code} copied to clipboard.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteClassMutation.mutateAsync(id);
      toast({ title: "Course deleted", description: `${name} has been deleted.` });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const openEditDialog = (course: any) => {
    setEditId(course.id);
    setEditName(course.name);
    setEditPhoto(course.cover_image || null);
    setEditOpen(true);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditSave = async () => {
    if (!editId || !editName.trim()) return;
    try {
      await updateClassMutation.mutateAsync({
        id: editId,
        name: editName.trim(),
        ...(editPhoto != null ? { cover_image: editPhoto } : {}),
      });
      setEditOpen(false);
      toast({ title: "Course updated" });
    } catch {
      toast({ title: "Failed to update course", variant: "destructive" });
    }
  };

  if (isLoading) return <PageSkeleton cards={3} />;
  if (error) return <ErrorState message="Failed to load courses" onRetry={refetch} />;

  const courses = classes || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Course Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create courses, share the invite code with students, and manage enrollment.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Course
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course: any) => (
          <Card
            key={course.id}
            className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
            onClick={() => {
              if (editOpen) return;
              navigate(`/dashboard/courses/${course.id}`);
            }}
          >
            {/* Cover image -- always shown, uses default if none set */}
            <div className="relative h-40 overflow-hidden group">
              <img
                src={course.cover_image || defaultCourseCover}
                alt={course.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleChangePhoto(course.id); }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Change cover photo"
              >
                <ImagePlus className="h-6 w-6 text-white" />
              </button>
            </div>
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {course.name}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2" onSelect={(e) => e.preventDefault()}>
                    <Eye className="h-4 w-4" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onSelect={(e) => { e.preventDefault(); openEditDialog(course); }} onClick={(e) => e.stopPropagation()}>
                    <Pencil className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive"
                    onSelect={(e) => { e.preventDefault(); handleDelete(course.id, course.name); }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-3">
              {course.invite_code && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs tracking-wider">
                    {course.invite_code}
                  </Badge>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyCode(course.invite_code, course.id); }}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    aria-label="Copy invite code"
                  >
                    {copiedId === course.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {course.member_count || 0} students
                </span>
                <span className="text-muted-foreground">{course.exam_count || 0} exams</span>
              </div>

              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Upload className="h-3.5 w-3.5" />
                Enroll via CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update the course name or cover photo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-course-name">Course Name</Label>
              <Input
                id="edit-course-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cover Photo</Label>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleEditPhotoChange}
              />
              {editPhoto ? (
                <div className="relative h-32 rounded-lg overflow-hidden border border-border">
                  <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setEditPhoto(null); if (editFileInputRef.current) editFileInputRef.current.value = ""; }}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs">Click to upload a cover photo</span>
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={!editName.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Course Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              An invite code will be generated automatically. Share it with your students so they can enroll.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="course-name">Course Name</Label>
              <Input
                id="course-name"
                placeholder="e.g. CS401 — Operating Systems"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-section">Section (optional)</Label>
              <Input
                id="course-section"
                placeholder="e.g. Section A"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cover Photo (optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              {newPhoto ? (
                <div className="relative h-32 rounded-lg overflow-hidden border border-border">
                  <img src={newPhoto} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setNewPhoto(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs">Click to upload a cover photo</span>
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createClassMutation.isPending}>
              {createClassMutation.isPending ? "Creating..." : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================
   STUDENT VIEW
   ================================================================ */
function StudentCourses() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: classes, isLoading, error, refetch } = useStudentClasses();
  const joinClassMutation = useJoinClass();
  const leaveClassMutation = useLeaveClass();

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [courseIdInput, setCourseIdInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLeave = async (id: number, name: string) => {
    try {
      await leaveClassMutation.mutateAsync(id);
      toast({ title: "Left course", description: `You have left ${name}.` });
    } catch (err: any) {
      toast({ title: "Failed to leave", description: err.message, variant: "destructive" });
    }
  };

  const handleEnroll = async () => {
    const code = courseIdInput.trim();
    if (!code) return;
    try {
      await joinClassMutation.mutateAsync(code);
      setCourseIdInput("");
      setEnrollOpen(false);
      toast({ title: "Enrolled!", description: `You have been enrolled in the course.` });
    } catch (err: any) {
      toast({ title: "Enrollment failed", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) return <PageSkeleton cards={3} />;
  if (error) return <ErrorState message="Failed to load courses" onRetry={refetch} />;

  const courses = classes || [];
  const filtered = courses.filter(
    (c: any) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.invite_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your enrolled courses or join a new one using an invite code.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setEnrollOpen(true)}>
          <LogIn className="h-4 w-4" />
          Enroll in Course
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">No courses found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Try a different search." : "Enroll in a course using the invite code from your teacher."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course: any) => (
            <Card
              key={course.id}
              className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              onClick={() => navigate(`/dashboard/courses/${course.id}`)}
            >
              {/* Cover image */}
              <div className="h-40 overflow-hidden">
                <img
                  src={course.cover_image || defaultCourseCover}
                  alt={course.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {course.name}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2 text-destructive focus:text-destructive"
                      onSelect={(e) => { e.preventDefault(); handleLeave(course.id, course.name); }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LogOut className="h-4 w-4" /> Leave
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2">
                {course.invite_code && (
                  <Badge variant="secondary" className="font-mono text-xs tracking-wider">
                    {course.invite_code}
                  </Badge>
                )}
                {course.teacher_name && <p className="text-sm text-muted-foreground">Instructor: {course.teacher_name}</p>}
                {course.section && <p className="text-sm text-muted-foreground">{course.section}</p>}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{course.exam_count || 0} exams</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enroll Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll in a Course</DialogTitle>
            <DialogDescription>
              Enter the invite code provided by your teacher to join the course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="enroll-id">Invite Code</Label>
              <Input
                id="enroll-id"
                placeholder="e.g. APX-CS101"
                className="font-mono"
                value={courseIdInput}
                onChange={(e) => setCourseIdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnroll()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={!courseIdInput.trim() || joinClassMutation.isPending}>
              {joinClassMutation.isPending ? "Enrolling..." : "Enroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================
   MAIN EXPORT
   ================================================================ */
export default function Courses() {
  const { role } = useRole();
  return role === "teacher" ? <TeacherCourses /> : <StudentCourses />;
}
