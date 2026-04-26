import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users, FileText, GraduationCap,
  Plus, BarChart3, BookOpen, Clock, MoreHorizontal, Eye, Pencil, Trash2,
  ClipboardCheck,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { useUser } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTeacherDashboard } from "@/hooks/useTeacherDashboard";
import { useDeleteExam } from "@/hooks/useExams";
import { useClasses } from "@/hooks/useClasses";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import defaultCourseCover from "@/assets/default-course-cover.jpg";

const quickActions = [
  { label: "Create Exam", desc: "Build a new exam", icon: Plus, route: "/dashboard/exam-builder" },
  { label: "Create Course", desc: "Start a new course", icon: BookOpen, route: "/dashboard/courses", state: { openCreate: true } },
  { label: "View Results", desc: "Check submissions", icon: BarChart3, route: "/dashboard/results" },
  { label: "Question Bank", desc: "Manage questions", icon: BookOpen, route: "/dashboard/question-bank" },
];

const getBarColor = (avg: number) => {
  if (avg >= 80) return "hsl(142, 71%, 45%)";
  if (avg >= 70) return "hsl(var(--primary))";
  return "hsl(0, 84%, 60%)";
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { name } = useUser();
  const { toast } = useToast();
  const { data: dashboard, isLoading, error, refetch } = useTeacherDashboard();
  const deleteExamMutation = useDeleteExam();
  const { data: classesList } = useClasses();

  if (isLoading) return <PageSkeleton cards={3} rows={4} />;
  if (error) return <ErrorState message="Failed to load dashboard" onRetry={refetch} />;

  const d = dashboard || {};
  const courses = classesList || [];
  const statsData = [
    { label: "Total Students", value: String(d.total_students || 0), icon: Users },
    { label: "Active Exams", value: String(d.active_exams || 0), icon: FileText },
    { label: "Classes", value: String(d.total_classes || 0), icon: GraduationCap },
  ];

  const pendingGrading = d.pending_grading || [];
  const activeExamList = d.active_exam_list || [];
  const recentActivity = d.recent_activity || [];
  const classPerformance = d.class_performance || [];
  const classAvg = classPerformance.length > 0
    ? Math.round(classPerformance.reduce((s: number, c: any) => s + (c.average_score || 0), 0) / classPerformance.length * 100) / 100
    : 0;

  const handleDeleteExam = async (examId: number, examName: string) => {
    try {
      await deleteExamMutation.mutateAsync(examId);
      toast({ title: "Exam deleted", description: `${examName} has been deleted.` });
      refetch();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {name}</h1>
        <p className="text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsData.map((s) => (
          <Card key={s.label} className="bg-card/80 backdrop-blur-md border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <span className="text-2xl font-bold text-foreground">{s.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.route, a.state ? { state: a.state } : undefined)}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/80 backdrop-blur-md p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <a.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Active Courses + Pending Grading */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Active Courses */}
        <Card className="lg:col-span-3 bg-card/80 backdrop-blur-md border-border/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">Active Courses</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/dashboard/courses")}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No courses yet</p>
            ) : (
              courses.slice(0, 3).map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/dashboard/courses/${c.id}`)}
                  className="flex items-center gap-3 rounded-lg border border-border/30 p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <img
                    src={c.cover_image || defaultCourseCover}
                    alt={c.name}
                    className="h-12 w-20 rounded-md object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.member_count || 0} students{c.section ? ` \u2022 ${c.section}` : ""}</p>
                  </div>
                  {c.invite_code && (
                    <Badge variant="secondary" className="font-mono text-[10px] shrink-0">{c.invite_code}</Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Grading */}
        <Card
          className="lg:col-span-2 bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate("/dashboard/grading")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingGrading.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending grading — tap to review submissions</p>
            ) : (
              pendingGrading.slice(0, 5).map((g: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border/30 p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate("/dashboard/grading")}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                    <ClipboardCheck className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{g.exam_name || g.examName || "Exam"}</p>
                    <p className="text-xs text-muted-foreground">{g.course_name || g.course || ""}</p>
                  </div>
                  <Badge variant="destructive" className="text-[10px] shrink-0">
                    {g.pending || g.count || 0} pending
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Exams + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Active Exams */}
        <Card className="lg:col-span-3 bg-card/80 backdrop-blur-md border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Active Exams</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeExamList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active exams</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="px-5 py-2 text-left font-medium">Exam</th>
                      <th className="px-3 py-2 text-left font-medium">Class</th>
                      <th className="px-3 py-2 text-left font-medium">Progress</th>
                      <th className="px-3 py-2 text-left font-medium">Time</th>
                      <th className="px-3 py-2 text-left font-medium">Status</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {activeExamList.map((e: any) => (
                      <tr key={e.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-foreground">{e.title}</td>
                        <td className="px-3 py-3 text-muted-foreground">{e.class_name || "\u2014"}</td>
                        <td className="px-3 py-3 text-muted-foreground">{e.submissions || 0}/{e.students || 0}</td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {e.end_time ? formatDistanceToNow(new Date(e.end_time), { addSuffix: true }) : "\u2014"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={e.status === "active" ? "default" : "secondary"} className="rounded-full text-xs capitalize">
                            {e.status || "active"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="More options">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/exam-preview/${e.id}`)} className="gap-2">
                                <Eye className="h-4 w-4" /> Preview as Student
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate("/dashboard/exam-builder", { state: { editExam: e } })} className="gap-2">
                                <Pencil className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate("/dashboard/results")} className="gap-2">
                                <BarChart3 className="h-4 w-4" /> View Results
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteExam(e.id, e.title)} className="gap-2 text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-card/80 backdrop-blur-md border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivity.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                      {(a.user_name || a.type || "?").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground leading-snug">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.timestamp ? formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }) : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Chart */}
      {classPerformance.length > 0 && (
        <Card className="bg-card/80 backdrop-blur-md border-border/50 max-w-4xl">
          <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Class Performance</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Average scores across all sections</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(142, 71%, 45%)" }} />{"\u2265"} 80%</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" />70{"\u2013"}79%</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(0, 84%, 60%)" }} />&lt; 70%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformance.map((c: any) => ({ name: c.class_name, avg: c.average_score, students: c.student_count, trend: c.trend || 0 }))} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ReferenceLine
                    y={classAvg}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="6 4"
                    strokeOpacity={0.5}
                    label={{
                      value: `Avg ${classAvg}%`,
                      position: "right",
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted-foreground) / 0.06)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const entry = payload[0].payload;
                      const trendIcon = entry.trend > 0 ? "\u2191" : entry.trend < 0 ? "\u2193" : "\u2192";
                      const trendColor = entry.trend > 0 ? "text-green-500" : entry.trend < 0 ? "text-red-500" : "text-muted-foreground";
                      return (
                        <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
                          <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-foreground font-bold">Score: {entry.avg}%</span>
                            <span className={`text-xs font-medium ${trendColor}`}>{trendIcon} {Math.abs(entry.trend)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{entry.students} students</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="avg" radius={[8, 8, 0, 0]} maxBarSize={52}>
                    {classPerformance.map((_: any, index: number) => (
                      <Cell key={index} fill={getBarColor(classPerformance[index]?.average_score || 0)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
