import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useClass, useStudentClass } from "@/hooks/useClasses";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useExams, useExamResults } from "@/hooks/useExams";
import { getExamPhase } from "@/features/exams/lib/examStatus";
import { format } from "date-fns";

import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from "@/hooks/useAnnouncements";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeClassMember, updateClass } from "@/lib/api";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import {
  BookOpen, ArrowLeft, Clock, FileText, Megaphone, Trophy,
  Users, Copy, Check, Upload, Plus, Search, MoreHorizontal,
  Trash2, Eye, Download, Send, BarChart3, Pencil, Lock, AlertCircle, Paperclip, ChevronLeft, ChevronRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import defaultCourseCover from "@/assets/default-course-cover.jpg";

const statusColor = (s: string) => {
  if (s === "upcoming") return "bg-accent/15 text-accent border-accent/30";
  if (s === "completed" || s === "active") return "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
  return "bg-muted text-muted-foreground";
};

const gradeColor = (pct: number) => {
  if (pct >= 90) return "text-green-600 dark:text-green-400";
  if (pct >= 75) return "text-accent";
  if (pct >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-destructive";
};

/* -- Confetti helper -- */
function ConfettiBurst({ fire, firedRef }: { fire: boolean; firedRef: React.MutableRefObject<boolean> }) {
  useEffect(() => {
    if (fire && !firedRef.current) {
      firedRef.current = true;
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }, [fire, firedRef]);
  return null;
}

/* ================================================================
   STUDENT COURSE DETAIL
   ================================================================ */
function StudentCourseDetail({ classData }: { classData: any }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "exams";
  const confettiFired = useRef(false);
  const { data: announcementsList } = useAnnouncements(classData.id);

  // Build exams list from class data
  const classExams: any[] = classData.exams || [];
  const rawSubmissions: any[] = classData.submissions || [];

  // Aggregate submissions by exam: sum earned scores, compute percentage against exam total
  const examGrades = classExams.map((exam: any) => {
    const subs = rawSubmissions.filter((s: any) => s.exam_id === exam.id);
    const problems: any[] = exam.problems || [];
    // sub.score is 0-100 percentage; convert to earned points
    const earned = subs.reduce((sum: number, s: any) => {
      const prob = problems.find((p: any) => p.id === s.problem_id);
      const maxPts = prob?.points || 0;
      return sum + (s.score || 0) / 100 * maxPts;
    }, 0);
    const totalPoints = problems.reduce((sum: number, p: any) => sum + (p.points || 0), 0) || 100;
    const pct = totalPoints > 0 ? Math.round((earned / totalPoints) * 10000) / 100 : 0;
    const latestDate = subs.length > 0
      ? subs.reduce((latest: string, s: any) => (s.submitted_at && s.submitted_at > latest ? s.submitted_at : latest), subs[0]?.submitted_at || "")
      : null;
    return { exam, earned, totalPoints, pct, date: latestDate, hasSubmission: subs.length > 0 };
  }).filter((g) => g.hasSubmission);

  const scores = examGrades.map((g) => g.pct);
  const overallAvg = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100
    : 0;

  const hasFullMark = scores.some((s) => s >= 100);
  const gradesAnnounced = classData.grades_announced === true;
  const passingThreshold = classData.passing_threshold ?? 60;

  return (
    <div className="space-y-6">
      {/* Cover image */}
      <div className="rounded-xl overflow-hidden h-40 sm:h-52">
        <img src={classData.cover_image || defaultCourseCover} alt={classData.name} className="w-full h-full object-cover" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/courses")} className="mt-1 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {classData.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {classData.teacher_name && <>Instructor: {classData.teacher_name} &bull; </>}
            {classData.section && <>{classData.section} &bull; </>}
            {classData.invite_code && <>Course ID: <span className="font-mono">{classData.invite_code}</span></>}
          </p>
        </div>
        {gradesAnnounced && (
          <div className="text-right hidden sm:block">
            <p className="text-sm text-muted-foreground">Overall Average</p>
            <p className={`text-2xl font-bold ${gradeColor(overallAvg)}`}>{overallAvg}%</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-4">
        <TabsList>
          <TabsTrigger value="exams" className="gap-1.5">
            <FileText className="h-4 w-4" /> Exams
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-1.5">
            <Trophy className="h-4 w-4" /> Grades
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5">
            <Megaphone className="h-4 w-4" /> Announcements
          </TabsTrigger>
        </TabsList>

        {/* EXAMS TAB */}
        <TabsContent value="exams" className="space-y-3">
          {classExams.length === 0 ? (
            <EmptyState icon={FileText} title="No exams" description="No exams have been assigned to this course yet." />
          ) : (
            classExams.map((exam: any) => {
              const phase = getExamPhase(exam);
              const locked = phase === "upcoming";
              const clickable = phase === "active" || phase === "completed";
              return (
              <Card
                key={exam.id}
                className={`border-border/50 bg-card/80 backdrop-blur-sm transition-shadow ${clickable ? "hover:shadow-md cursor-pointer" : "cursor-not-allowed opacity-70"}`}
                onClick={() => {
                  if (phase === "completed") navigate(`/dashboard/exam/${exam.id}/review`);
                  else if (phase === "active") navigate(`/dashboard/exam/${exam.id}/take`);
                }}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{exam.title || exam.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {exam.start_time ? format(new Date(exam.start_time), "MMM d, yyyy · h:mm a") : "TBD"}
                      </span>
                      <span>&bull;</span>
                      <span>{exam.duration_minutes || 60} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {exam.score != null && (
                      <span className={`text-lg font-bold ${gradeColor(exam.score)}`}>{exam.score}%</span>
                    )}
                    {locked ? (
                      <Badge variant="outline" className={`${statusColor("upcoming")} gap-1`}>
                        <Lock className="h-3 w-3" /> Upcoming
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={statusColor(phase)}>{phase}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
              );
            })
          )}
        </TabsContent>

        {/* GRADES TAB */}
        <TabsContent value="grades" className="space-y-4">
          {!gradesAnnounced ? (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Grades Not Yet Available</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Your instructor hasn't published grades for this course yet. Check back later.
                </p>
              </CardContent>
            </Card>
          ) : examGrades.length === 0 ? (
            <EmptyState icon={Trophy} title="No grades yet" description="You don't have any graded submissions for this course." />
          ) : (
            <>
              <ConfettiBurst fire={hasFullMark} firedRef={confettiFired} />

              {overallAvg < passingThreshold && (
                <Alert variant="destructive" className="border-destructive/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Course At Risk</AlertTitle>
                  <AlertDescription>
                    Your current average ({overallAvg}%) is below the passing threshold of {passingThreshold}%. Consider reviewing past material or reaching out to your instructor.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground">
                        <th className="px-5 py-3 text-left font-medium">Exam</th>
                        <th className="px-3 py-3 text-left font-medium">Date</th>
                        <th className="px-3 py-3 text-right font-medium">Score</th>
                        <th className="px-3 py-3 text-right font-medium">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examGrades.map((g, i) => (
                        <tr key={g.exam.id || i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 font-medium text-foreground">{g.exam.title || `Exam #${i + 1}`}</td>
                          <td className="px-3 py-3 text-muted-foreground">{g.date ? new Date(g.date).toLocaleDateString() : "—"}</td>
                          <td className="px-3 py-3 text-right text-foreground">{Math.round(g.earned)}/{g.totalPoints}</td>
                          <td className={`px-3 py-3 text-right font-bold ${gradeColor(g.pct)}`}>{g.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/50 bg-card/80">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Exams</p>
                    <p className="text-2xl font-bold text-foreground">{examGrades.length}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/80">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Average</p>
                    <p className={`text-2xl font-bold ${gradeColor(overallAvg)}`}>{overallAvg}%</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/80">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Highest</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Math.max(...scores.map((s) => s))}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ANNOUNCEMENTS TAB */}
        <TabsContent value="announcements" className="space-y-3">
          {(announcementsList || []).length === 0 ? (
            <EmptyState icon={Megaphone} title="No announcements" description="No announcements have been posted for this course yet." />
          ) : (
            (announcementsList || []).map((a: any) => (
              <Card key={a.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-foreground">{a.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0 ml-4">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                  <AnnouncementAttachments raw={a.attachments} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ================================================================
   TEACHER COURSE DETAIL
   ================================================================ */
function TeacherCourseDetail({ classData }: { classData: any }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "students";
  const { toast } = useToast();
  const { data: allExams } = useExams();
  const [copiedId, setCopiedId] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewStudent, setViewStudent] = useState<any>(null);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announceAttachments, setAnnounceAttachments] = useState<{ name: string; type: string; data: string }[]>([]);
  const { data: announcements = [] } = useAnnouncements(classData.id);
  const createAnnouncementMutation = useCreateAnnouncement(classData.id);
  const updateAnnouncementMutation = useUpdateAnnouncement(classData.id);
  const deleteAnnouncementMutation = useDeleteAnnouncement(classData.id);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<number | null>(null);
  const [gradesAnnounced, setGradesAnnounced] = useState(classData.grades_announced || false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [passingThreshold, setPassingThreshold] = useState(classData.passing_threshold ?? 60);
  const qc = useQueryClient();
  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeClassMember(classData.id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class", classData.id] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const examsForClass = classData.exams || (allExams || []).filter((e: any) =>
    (e.exam_classes || []).some((ec: any) => ec.class_id === classData.id)
  );

  const members = classData.members || [];
  const filteredStudents = members.filter((s: any) =>
    (s.user?.name || s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.user?.email || s.id || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyCode = () => {
    const code = classData.invite_code || String(classData.id);
    navigator.clipboard.writeText(code);
    setCopiedId(true);
    toast({ title: "Copied!", description: `Code ${code} copied to clipboard.` });
    setTimeout(() => setCopiedId(false), 2000);
  };

  const removeStudent = async (studentId: string | number) => {
    const uid = Number(studentId);
    if (!uid) return;
    try {
      await removeMemberMutation.mutateAsync(uid);
      toast({ title: "Student removed" });
    } catch (err: any) {
      toast({ title: "Failed to remove", description: err.message || "Please try again.", variant: "destructive" });
    }
  };

  const openEditAnnouncement = (a: any) => {
    setEditingAnnouncement(a);
    setAnnounceTitle(a.title || "");
    setAnnounceBody(a.body || "");
    setAnnounceAttachments(parseAttachments(a.attachments));
    setAnnounceOpen(true);
  };

  const closeAnnounceDialog = () => {
    setAnnounceOpen(false);
    setEditingAnnouncement(null);
    setAnnounceTitle("");
    setAnnounceBody("");
    setAnnounceAttachments([]);
  };

  const postAnnouncement = async () => {
    if (!announceTitle.trim()) return;
    try {
      if (editingAnnouncement) {
        await updateAnnouncementMutation.mutateAsync({
          id: editingAnnouncement.id,
          data: {
            title: announceTitle.trim(),
            body: announceBody.trim(),
            attachments: JSON.stringify(announceAttachments),
          },
        });
        toast({ title: "Announcement updated" });
      } else {
        await createAnnouncementMutation.mutateAsync({
          title: announceTitle.trim(),
          body: announceBody.trim(),
          attachments: JSON.stringify(announceAttachments),
        });
        toast({ title: "Announcement posted" });
      }
      closeAnnounceDialog();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message || "Please try again.", variant: "destructive" });
    }
  };

  const confirmDeleteAnnouncement = async () => {
    if (!deletingAnnouncementId) return;
    try {
      await deleteAnnouncementMutation.mutateAsync(deletingAnnouncementId);
      toast({ title: "Announcement deleted" });
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setDeletingAnnouncementId(null);
    }
  };

  const handleAnnounceAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: `${f.name} exceeds 5 MB.`, variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAnnounceAttachments((prev) => [...prev, { name: f.name, type: f.type, data: String(reader.result) }]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const exportGradesCSV = () => {
    // Build CSV from members + exam results
    const examTitles = examsForClass.map((e: any) => e.title || e.name || `Exam ${e.id}`);
    const headers = ["Student", "Email", ...examTitles, "Average"];
    const rows = members.map((m: any) => {
      const name = m.user?.name || m.name || "—";
      const email = m.user?.email || "—";
      const scores = examTitles.map(() => "—"); // Placeholder: actual scores need per-student exam results
      return [name, email, ...scores, "—"];
    });
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${classData.invite_code || classData.id}_grades.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: "Grades CSV downloaded." });
  };

  const announceGrades = async () => {
    try {
      await updateClass(classData.id, { grades_announced: true });
      await createAnnouncementMutation.mutateAsync({
        title: "Grades Published",
        body: "All current grades have been published and are now visible to students.",
      });
      setGradesAnnounced(true);
      qc.invalidateQueries({ queryKey: ["class", classData.id] });
      toast({ title: "Grades announced!", description: "Students can now view their grades." });
    } catch (err: any) {
      setBlockMessage(err?.message || "Grade all written submissions first.");
    }
  };

  const unannounceGrades = async () => {
    try {
      await updateClass(classData.id, { grades_announced: false });
      setGradesAnnounced(false);
      qc.invalidateQueries({ queryKey: ["class", classData.id] });
      toast({ title: "Grades hidden", description: "Students can no longer view their grades." });
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cover image */}
      <div className="rounded-xl overflow-hidden h-40 sm:h-52">
        <img src={classData.cover_image || defaultCourseCover} alt={classData.name} className="w-full h-full object-cover" />
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/courses")} className="mt-1 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {classData.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {classData.invite_code && (
              <>
                <Badge variant="secondary" className="font-mono text-xs tracking-wider">{classData.invite_code}</Badge>
                <button
                  onClick={copyCode}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {copiedId ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </>
            )}
            <span className="text-sm text-muted-foreground">&middot; {classData.member_count || members.length} students</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })} className="space-y-4">
        <TabsList>
          <TabsTrigger value="students" className="gap-1.5">
            <Users className="h-4 w-4" /> Students
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-1.5">
            <FileText className="h-4 w-4" /> Exams
          </TabsTrigger>
          <TabsTrigger value="grades" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Grades
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5">
            <Megaphone className="h-4 w-4" /> Announcements
          </TabsTrigger>
        </TabsList>

        {/* STUDENTS TAB */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="outline" className="gap-1.5">
              <Upload className="h-4 w-4" /> Enroll via CSV
            </Button>
          </div>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="px-5 py-3 text-left font-medium">Student</th>
                    <th className="px-3 py-3 text-left font-medium">Email</th>
                    <th className="px-3 py-3 text-right font-medium">Average</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s: any) => {
                    const name = s.user?.name || s.name || "Unknown";
                    const email = s.user?.email || "—";
                    const avg = s.avg ?? s.average ?? null;
                    return (
                      <tr key={s.id || s.user_id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                                {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground text-xs">{email}</td>
                        <td className={`px-3 py-3 text-right font-bold ${avg != null ? gradeColor(avg) : "text-muted-foreground"}`}>
                          {avg != null ? `${avg}%` : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onSelect={() => setTimeout(() => setViewStudent(s))}>
                                <Users className="h-4 w-4" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" onSelect={() => navigate("/dashboard/results")}>
                                <BarChart3 className="h-4 w-4" /> View Submission
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => removeStudent(s.user_id)}>
                                <Trash2 className="h-4 w-4" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No students found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXAMS TAB */}
        <TabsContent value="exams" className="space-y-3">
          <div className="flex justify-end">
            <Button className="gap-1.5" onClick={() => navigate("/dashboard/exam-builder")}>
              <Plus className="h-4 w-4" /> Assign Exam
            </Button>
          </div>
          {examsForClass.length === 0 ? (
            <EmptyState icon={FileText} title="No exams" description="Create an exam for this course." />
          ) : (
            examsForClass.map((exam: any) => (
              <Card key={exam.id} className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{exam.title || exam.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.scheduled_at ? new Date(exam.scheduled_at).toLocaleDateString() : "TBD"}</span>
                      <span>&bull;</span>
                      <span>{exam.duration_minutes || 60} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColor(exam.status || "upcoming")}>{exam.status || "upcoming"}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => navigate("/dashboard/exam-builder", { state: { editExam: exam } })}>
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => navigate(`/dashboard/exam-preview/${exam.id}`)}>
                          <Eye className="h-4 w-4" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => navigate("/dashboard/results")}>
                          <BarChart3 className="h-4 w-4" /> Results
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* GRADES TAB */}
        <TabsContent value="grades" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 min-w-[280px]">
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                Passing threshold:
              </p>
              <Slider
                value={[passingThreshold]}
                onValueChange={(val) => setPassingThreshold(val[0])}
                onValueCommit={(val) => toast({ title: "Threshold updated", description: `Passing grade set to ${val[0]}%` })}
                min={40}
                max={80}
                step={5}
                className="w-32"
              />
              <span className="text-sm font-medium min-w-[3ch] text-right">{passingThreshold}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportGradesCSV}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              {gradesAnnounced ? (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={unannounceGrades}>
                  <Send className="h-4 w-4" /> Unannounce
                </Button>
              ) : (
                <Button size="sm" className="gap-1.5" onClick={announceGrades}>
                  <Send className="h-4 w-4" /> Announce Grades
                </Button>
              )}
            </div>
          </div>

          {members.length === 0 ? (
            <EmptyState icon={BarChart3} title="No grade data" description="No students are enrolled yet." />
          ) : (
            <>
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-muted-foreground">
                          <th className="px-4 py-3 text-left font-medium sticky left-0 bg-card/90 backdrop-blur-sm z-10">Student</th>
                          <th className="px-3 py-3 text-left font-medium">Email</th>
                          {examsForClass.map((e: any) => (
                            <th key={e.id} className="px-3 py-3 text-center font-medium whitespace-nowrap">{e.title || e.name || `Exam ${e.id}`}</th>
                          ))}
                          <th className="px-3 py-3 text-center font-medium">Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m: any) => {
                          const name = m.user?.name || m.name || "Unknown";
                          const email = m.user?.email || "—";
                          const avg = m.avg ?? m.average ?? null;
                          const isFailing = avg != null && avg < passingThreshold;
                          return (
                            <tr key={m.id || m.user_id} className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${isFailing ? "bg-destructive/5" : ""}`}>
                              <td className="px-4 py-3 font-medium text-foreground sticky left-0 bg-card/90 backdrop-blur-sm z-10">
                                <span className="flex items-center gap-2">
                                  {name}
                                  {isFailing && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-muted-foreground text-xs">{email}</td>
                              {examsForClass.map((e: any) => {
                                const score = m.exam_scores?.[String(e.id)] ?? m.exam_scores?.[e.id] ?? null;
                                return (
                                  <td key={e.id} className={`px-3 py-3 text-center font-semibold ${score != null ? gradeColor(score) : "text-muted-foreground"}`}>
                                    {score != null ? score : "—"}
                                  </td>
                                );
                              })}
                              <td className={`px-3 py-3 text-center font-bold ${isFailing ? "text-destructive" : avg != null ? gradeColor(avg) : "text-muted-foreground"}`}>
                                {avg != null ? `${avg}%` : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Failing students summary */}
              {(() => {
                const failCount = members.filter((m: any) => {
                  const avg = m.avg ?? m.average ?? null;
                  return avg != null && avg < passingThreshold;
                }).length;
                return failCount > 0 ? (
                  <Alert variant="destructive" className="border-destructive/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{failCount} student{failCount > 1 ? "s" : ""} below passing threshold</AlertTitle>
                    <AlertDescription>
                      {failCount} out of {members.length} students have an average below {passingThreshold}%.
                    </AlertDescription>
                  </Alert>
                ) : null;
              })()}
            </>
          )}
        </TabsContent>

        {/* ANNOUNCEMENTS TAB */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-1.5" onClick={() => setAnnounceOpen(true)}>
              <Plus className="h-4 w-4" /> Post Announcement
            </Button>
          </div>
          {announcements.length === 0 ? (
            <EmptyState icon={Megaphone} title="No announcements" description="Post an announcement for your students." />
          ) : (
            announcements.map((a: any) => (
              <Card key={a.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">{a.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleDateString() : a.date || ""}</span>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(e) => { e.preventDefault(); setTimeout(() => openEditAnnouncement(a), 0); }}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => { e.preventDefault(); setTimeout(() => setDeletingAnnouncementId(a.id), 0); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                  <AnnouncementAttachments raw={a.attachments} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

      </Tabs>

      {/* View Student Dialog */}
      <Dialog open={!!viewStudent} onOpenChange={(open) => { if (!open) setViewStudent(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {viewStudent && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                  {(viewStudent.user?.name || viewStudent.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-foreground">{viewStudent.user?.name || viewStudent.name}</p>
                <p className="text-sm text-muted-foreground">{viewStudent.user?.email || "—"}</p>
              </div>
              <div className="w-full border-t border-border/50 pt-4 space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Role:</span> <span className="text-foreground">Student</span></p>
                {viewStudent.joined_at && (
                  <p className="text-sm"><span className="text-muted-foreground">Joined:</span> <span className="text-foreground">{new Date(viewStudent.joined_at).toLocaleDateString()}</span></p>
                )}
                {(viewStudent.avg ?? viewStudent.average) != null && (
                  <p className="text-sm"><span className="text-muted-foreground">Average:</span> <span className={`font-bold ${gradeColor(viewStudent.avg ?? viewStudent.average)}`}>{viewStudent.avg ?? viewStudent.average}%</span></p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Post / Edit Announcement Dialog */}
      <Dialog open={announceOpen} onOpenChange={(o) => { if (!o) closeAnnounceDialog(); else setAnnounceOpen(true); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "Post Announcement"}</DialogTitle>
            <DialogDescription>This will be visible to all enrolled students.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="a-title">Title</Label>
              <Input id="a-title" placeholder="Announcement title" value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-body">Message</Label>
              <Textarea id="a-body" placeholder="Write your announcement..." rows={4} value={announceBody} onChange={(e) => setAnnounceBody(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label>Attachments (optional)</Label>
                <input id="a-attach" type="file" multiple className="hidden" onChange={handleAnnounceAttach} />
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => document.getElementById("a-attach")?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Add files / images
                </Button>
              </div>
              {announceAttachments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {announceAttachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border border-border/50 px-2 py-1.5 text-xs">
                      {att.type.startsWith("image/") ? (
                        <img src={att.data} alt={att.name} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="flex-1 truncate">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setAnnounceAttachments((prev) => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAnnounceDialog}>Cancel</Button>
            <Button onClick={postAnnouncement} disabled={!announceTitle.trim()}>{editingAnnouncement ? "Save" : "Post"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingAnnouncementId !== null} onOpenChange={(o) => !o && setDeletingAnnouncementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. Students will no longer see this announcement.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAnnouncement} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!blockMessage} onOpenChange={(o) => !o && setBlockMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cannot announce grades</AlertDialogTitle>
            <AlertDialogDescription>{blockMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setBlockMessage(null)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ================================================================
   MAIN EXPORT
   ================================================================ */
export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useRole();
  const navigate = useNavigate();
  const isTeacher = role === "teacher";

  const classId = Number(id);
  const teacherQuery = useClass(isTeacher ? classId : 0);
  const studentQuery = useStudentClass(!isTeacher ? classId : 0);
  const { data: classData, isLoading, error } = isTeacher ? teacherQuery : studentQuery;

  if (isLoading) return <PageSkeleton cards={2} rows={4} />;
  if (error || !classData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground">Course not found</h2>
        <p className="text-sm text-muted-foreground mt-1">This course doesn't exist or you don't have access.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/courses")}>
          Back to Courses
        </Button>
      </div>
    );
  }

  return role === "teacher" ? <TeacherCourseDetail classData={classData} /> : <StudentCourseDetail classData={classData} />;
}

function parseAttachments(raw: any): { name: string; type: string; data: string }[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch { /* ignore */ }
  }
  return [];
}

function AnnouncementAttachments({ raw }: { raw: any }) {
  const list = parseAttachments(raw);
  const images = list.filter((a) => a.type?.startsWith("image/"));
  const files = list.filter((a) => !a.type?.startsWith("image/"));
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && lightboxIdx > 0) setLightboxIdx(lightboxIdx - 1);
      else if (e.key === "ArrowRight" && lightboxIdx < images.length - 1) setLightboxIdx(lightboxIdx + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, images.length]);

  if (list.length === 0) return null;

  const visibleImages = images.slice(0, 4);
  const hiddenCount = Math.max(0, images.length - 4);

  return (
    <div className="space-y-2 pt-2">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-2 py-0.5 text-xs text-muted-foreground">
        <Paperclip className="h-3 w-3" /> {list.length} attachment{list.length === 1 ? "" : "s"}
      </div>

      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {visibleImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIdx(i)}
              className="relative h-16 w-16 rounded overflow-hidden border border-border/50 hover:border-primary/50 transition"
            >
              <img src={img.data} alt={img.name} className="h-full w-full object-cover" />
              {i === 3 && hiddenCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-semibold text-white">
                  +{hiddenCount}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <a
              key={i}
              href={f.data}
              download={f.name}
              className="inline-flex items-center gap-2 rounded-md border border-border/50 px-3 py-1.5 text-xs hover:bg-muted/40"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{f.name}</span>
              <Download className="h-3 w-3 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}

      <Dialog open={lightboxIdx !== null} onOpenChange={(o) => !o && setLightboxIdx(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
          {lightboxIdx !== null && images[lightboxIdx] && (
            <div className="relative">
              <img
                src={images[lightboxIdx].data}
                alt={images[lightboxIdx].name}
                className="w-full max-h-[85vh] object-contain rounded-lg"
              />
              <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded bg-black/60 text-white">
                {lightboxIdx + 1} / {images.length}
              </div>
              {lightboxIdx > 0 && (
                <button
                  type="button"
                  onClick={() => setLightboxIdx(lightboxIdx - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {lightboxIdx < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIdx(lightboxIdx + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
