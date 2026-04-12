import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Plus, Users, Upload, Copy, Check, Search, LogIn,
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

/* ── mock data ── */
const initialCourseImages: Record<string, string> = {
  "APX-CS101": "https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=400&h=200&fit=crop",
  "APX-CS201": "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=200&fit=crop",
  "APX-CS301": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop",
};

const initialTeacherCourses = [
  { id: "APX-CS101", name: "CS101 — Intro to Programming", students: 45, exams: 3 },
  { id: "APX-CS201", name: "CS201 — Data Structures", students: 38, exams: 5 },
  { id: "APX-CS301", name: "CS301 — Algorithms", students: 32, exams: 2 },
];

const initialStudentCourses = [
  { id: "APX-CS101", name: "CS101 — Intro to Programming", teacher: "Dr. Smith", exams: 3 },
  { id: "APX-CS201", name: "CS201 — Data Structures", teacher: "Prof. Johnson", exams: 5 },
  { id: "APX-CS401", name: "CS401 — Machine Learning", teacher: "Dr. Adams", exams: 2 },
  { id: "APX-CS501", name: "CS501 — Operating Systems", teacher: "Prof. Chen", exams: 4 },
  { id: "APX-CS601", name: "CS601 — Computer Networks", teacher: "Dr. Patel", exams: 3 },
];

/* ── helpers ── */
function generateCourseId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "APX-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getCourseImage(courseImages: Record<string, string>, id: string): string {
  return courseImages[id] || defaultCourseCover;
}

/* ================================================================
   TEACHER VIEW
   ================================================================ */
function TeacherCourses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [courses, setCourses] = useState(initialTeacherCourses);
  const [courseImages, setCourseImages] = useState<Record<string, string>>(initialCourseImages);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
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

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = generateCourseId();
    setCourses((prev) => [{ id, name: newName.trim(), students: 0, exams: 0 }, ...prev]);
    if (newPhoto) {
      setCourseImages((prev) => ({ ...prev, [id]: newPhoto }));
    }
    setNewName("");
    setNewPhoto(null);
    setCreateOpen(false);
    toast({
      title: "Course created",
      description: (
        <span>
          Course ID: <strong>{id}</strong> — share this with your students so they can enroll.
        </span>
      ),
    });
  };

  const handleChangePhoto = (courseId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setCourseImages((prev) => ({ ...prev, [courseId]: reader.result as string }));
        toast({ title: "Cover photo updated" });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast({ title: "Copied!", description: `Course ID ${id} copied to clipboard.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Course deleted" });
  };

  const openEditDialog = (course: typeof courses[0]) => {
    setEditId(course.id);
    setEditName(course.name);
    setEditPhoto(courseImages[course.id] || null);
    setEditOpen(true);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditSave = () => {
    if (!editId || !editName.trim()) return;
    setCourses((prev) => prev.map((c) => c.id === editId ? { ...c, name: editName.trim() } : c));
    if (editPhoto) {
      setCourseImages((prev) => ({ ...prev, [editId]: editPhoto }));
    }
    setEditOpen(false);
    toast({ title: "Course updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Course Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create courses, share the course ID with students, and manage enrollment.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Course
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
            onClick={() => {
              if (editOpen) return;
              navigate(`/dashboard/courses/${course.id}`);
            }}
          >
            {/* Cover image — always shown, uses default if none set */}
            <div className="relative h-40 overflow-hidden group">
              <img
                src={getCourseImage(courseImages, course.id)}
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
                    onSelect={(e) => { e.preventDefault(); deleteCourse(course.id); }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs tracking-wider">
                  {course.id}
                </Badge>
                <button
                  onClick={(e) => { e.stopPropagation(); copyId(course.id); }}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  aria-label="Copy course ID"
                >
                  {copiedId === course.id ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {course.students} students
                </span>
                <span className="text-muted-foreground">{course.exams} exams</span>
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
              A unique course ID will be generated automatically. Share it with your students so they can enroll.
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
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Create Course
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
  const [courses, setCourses] = useState(initialStudentCourses);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [courseIdInput, setCourseIdInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleEnroll = () => {
    const id = courseIdInput.trim().toUpperCase();
    if (!id) return;
    if (courses.some((c) => c.id === id)) {
      toast({ title: "Already enrolled", description: "You are already in this course.", variant: "destructive" });
      return;
    }
    setCourses((prev) => [
      { id, name: `Course ${id}`, teacher: "Instructor", exams: 0 },
      ...prev,
    ]);
    setCourseIdInput("");
    setEnrollOpen(false);
    toast({ title: "Enrolled!", description: `You have been enrolled in ${id}.` });
  };

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your enrolled courses or join a new one using a course ID.
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
              {searchQuery ? "Try a different search." : "Enroll in a course using the course ID from your teacher."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Card
              key={course.id}
              className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              onClick={() => navigate(`/dashboard/courses/${course.id}`)}
            >
              {/* Cover image */}
              <div className="h-40 overflow-hidden">
                <img
                  src={getCourseImage(initialCourseImages, course.id)}
                  alt={course.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {course.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="secondary" className="font-mono text-xs tracking-wider">
                  {course.id}
                </Badge>
                <p className="text-sm text-muted-foreground">Instructor: {course.teacher}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{course.exams} exams</span>
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
              Enter the course ID provided by your teacher to join the course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="enroll-id">Course ID</Label>
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
            <Button onClick={handleEnroll} disabled={!courseIdInput.trim()}>
              Enroll
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
