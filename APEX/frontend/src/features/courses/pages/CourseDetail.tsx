import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useClass, useStudentClass } from "@/hooks/useClasses";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useExams, useExamResults } from "@/hooks/useExams";
import { useStudentSubmissions } from "@/hooks/useSubmissions";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import {
  BookOpen, ArrowLeft, Clock, FileText, Megaphone, Trophy,
  Users, Copy, Check, Plus, Search, MoreHorizontal,
  Trash2, Eye, Download, BarChart3, Pencil, AlertCircle,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import defaultCourseCover from "@/assets/default-course-cover.jpg";

const gradeColor = (pct: number) => {
  if (pct >= 90) return "text-green-600 dark:text-green-400";
  if (pct >= 75) return "text-accent";
  if (pct >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-destructive";
};

const statusColor = (s: string) => {
  if (s === "upcoming") return "bg-accent/15 text-accent border-accent/30";
  if (s === "completed" || s === "active") return "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
  return "bg-muted text-muted-foreground";
};

/* ================================================================
   STUDENT COURSE DETAIL
   ================================================================ */
function StudentCourseDetail({ classData }: { classData: any }) {
  const navigate = useNavigate();
  const { data: submissions } = useStudentSubmissions();

  // Filter submissions related to this class's exams
  const classSubmissions = (submissions || []).filter((s: any) => s.class_id === classData.id);
  const scores = classSubmissions.filter((s: any) => s.score != null).map((s: any) => s.score);
  const overallAvg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden h-40 sm:h-52">
        <img src={defaultCourseCover} alt={classData.name} className="w-full h-full object-cover" />
      </div>

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
            {classData.section && `${classData.section} • `}
            {classData.invite_code && <span className="font-mono">{classData.invite_code}</span>}
          </p>
        </div>
        {scores.length > 0 && (
          <div className="text-right hidden sm:block">
            <p className="text-sm text-muted-foreground">Overall Average</p>
            <p className={`text-2xl font-bold ${gradeColor(overallAvg)}`}>{overallAvg}%</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions" className="gap-1.5">
            <FileText className="h-4 w-4" /> Submissions
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-1.5">
            <BookOpen className="h-4 w-4" /> Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-3">
          {classSubmissions.length === 0 ? (
            <EmptyState icon={FileText} title="No submissions" description="You haven't submitted anything for this course yet." />
          ) : (
            classSubmissions.map((s: any) => (
              <Card key={s.id} className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{s.problem?.title || `Problem #${s.problem_id}`}</p>
                    <p className="text-xs text-muted-foreground">{s.status}</p>
                  </div>
                  {s.score != null && (
                    <span className={`text-lg font-bold ${gradeColor(s.score)}`}>{Math.round(s.score)}%</span>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="p-5 space-y-2">
              <p className="text-sm"><span className="text-muted-foreground">Course:</span> <span className="text-foreground font-medium">{classData.name}</span></p>
              {classData.section && <p className="text-sm"><span className="text-muted-foreground">Section:</span> <span className="text-foreground">{classData.section}</span></p>}
              {classData.member_count != null && <p className="text-sm"><span className="text-muted-foreground">Members:</span> <span className="text-foreground">{classData.member_count}</span></p>}
            </CardContent>
          </Card>
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
  const { toast } = useToast();
  const { data: allExams } = useExams();
  const [copiedId, setCopiedId] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewStudent, setViewStudent] = useState<any>(null);

  const examsForClass = (allExams || []).filter((e: any) =>
    e.class_id === classData.id || (e.classes || []).some((c: any) => c.id === classData.id)
  );

  const members = classData.members || [];
  const filteredStudents = members.filter((s: any) =>
    (s.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyCode = () => {
    const code = classData.invite_code || String(classData.id);
    navigator.clipboard.writeText(code);
    setCopiedId(true);
    toast({ title: "Copied!", description: `Code copied to clipboard.` });
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden h-40 sm:h-52">
        <img src={defaultCourseCover} alt={classData.name} className="w-full h-full object-cover" />
      </div>

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

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students" className="gap-1.5">
            <Users className="h-4 w-4" /> Students
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-1.5">
            <FileText className="h-4 w-4" /> Exams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search students..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {filteredStudents.length === 0 ? (
            <EmptyState icon={Users} title="No students" description={searchQuery ? "No students match your search." : "No students enrolled yet."} />
          ) : (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="px-5 py-3 text-left font-medium">Student</th>
                      <th className="px-3 py-3 text-left font-medium">Email</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s: any) => (
                      <tr key={s.id || s.user_id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                                {(s.user?.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{s.user?.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground text-xs">{s.user?.email || "—"}</td>
                        <td className="px-3 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onSelect={() => setTimeout(() => setViewStudent(s))}>
                                <Eye className="h-4 w-4" /> View
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="exams" className="space-y-3">
          <div className="flex justify-end">
            <Button className="gap-1.5" onClick={() => navigate("/dashboard/exam-builder")}>
              <Plus className="h-4 w-4" /> Create Exam
            </Button>
          </div>
          {examsForClass.length === 0 ? (
            <EmptyState icon={FileText} title="No exams" description="Create an exam for this course." />
          ) : (
            examsForClass.map((exam: any) => (
              <Card key={exam.id} className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{exam.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration_minutes || 60} min</span>
                      <span>&middot;</span>
                      <span>{exam.problem_count || 0} questions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewStudent} onOpenChange={(open) => { if (!open) setViewStudent(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {viewStudent && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                  {(viewStudent.user?.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-foreground">{viewStudent.user?.name}</p>
                <p className="text-sm text-muted-foreground">{viewStudent.user?.email || "—"}</p>
              </div>
              <div className="w-full border-t border-border/50 pt-4 space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Role:</span> <span className="text-foreground">Student</span></p>
                {viewStudent.joined_at && (
                  <p className="text-sm"><span className="text-muted-foreground">Joined:</span> <span className="text-foreground">{new Date(viewStudent.joined_at).toLocaleDateString()}</span></p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
