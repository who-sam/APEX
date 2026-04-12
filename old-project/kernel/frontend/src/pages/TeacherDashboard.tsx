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
  Users, FileText, GraduationCap, TrendingUp,
  Plus, School, BarChart3, BookOpen, Clock, MoreHorizontal, Eye, Pencil, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTeacherDashboard } from "@/hooks/useTeacherDashboard";
import { useDeleteExam } from "@/hooks/useExams";
import { formatRelativeTime } from "@/lib/mappers";
import { PageSkeleton } from "@/components/PageSkeleton";

const quickActions = [
  { label: "Create Exam", desc: "Build a new exam", icon: Plus, route: "/dashboard/exam-builder" },
  { label: "Create Class", desc: "Start a new class", icon: School, route: "/dashboard/team" },
  { label: "View Results", desc: "Check submissions", icon: BarChart3, route: "/dashboard/results" },
  { label: "Question Bank", desc: "Manage questions", icon: BookOpen, route: "/dashboard/exam-builder" },
];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const name = user?.name ?? "";
  const { toast } = useToast();
  const { data, isLoading } = useTeacherDashboard();
  const deleteExam = useDeleteExam();

  if (isLoading) return <PageSkeleton />;

  const stats = [
    { label: "Total Students", value: String(data?.total_students ?? 0), icon: Users, trend: "", up: true },
    { label: "Active Exams", value: String(data?.active_exams ?? 0), icon: FileText, trend: "", up: true },
    { label: "Classes", value: String(data?.total_classes ?? 0), icon: GraduationCap, trend: "", up: true },
    { label: "Average Score", value: `${Math.round(data?.average_score ?? 0)}%`, icon: BarChart3, trend: "", up: true },
  ];

  const activeExamList: any[] = data?.active_exam_list ?? [];
  const recentActivity: any[] = data?.recent_activity ?? [];
  const classPerformance: any[] = (data?.class_performance ?? []).map((c: any) => ({
    name: c.class_name,
    avg: Math.round(c.avg_score ?? 0),
  }));

  const handleDelete = (examId: number, examTitle: string) => {
    deleteExam.mutate(examId, {
      onSuccess: () => {
        toast({ title: "Exam deleted", description: `${examTitle} has been deleted.` });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {name}</h1>
        <p className="text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card/80 backdrop-blur-md border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">{s.value}</span>
                  {s.trend && (
                    <span className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      {s.trend}
                    </span>
                  )}
                </div>
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
            onClick={() => navigate(a.route)}
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

      {/* Active Exams + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Active Exams */}
        <Card className="lg:col-span-3 bg-card/80 backdrop-blur-md border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Active Exams</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="px-5 py-2 text-left font-medium">Exam</th>
                    <th className="px-3 py-2 text-left font-medium">Start</th>
                    <th className="px-3 py-2 text-left font-medium">End</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {activeExamList.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-6 text-center text-muted-foreground">No active exams</td></tr>
                  ) : activeExamList.map((e: any) => (
                    <tr key={e.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{e.title}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {e.start_time ? format(new Date(e.start_time), "MMM d, HH:mm") : "—"}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {e.end_time ? format(new Date(e.end_time), "MMM d, HH:mm") : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="default" className="rounded-full text-xs">active</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="More options">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/exam/${e.id}/review`)} className="gap-2">
                              <Eye className="h-4 w-4" /> View Results
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/dashboard/exam-builder")} className="gap-2">
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(e.id, e.title)} className="gap-2 text-destructive focus:text-destructive">
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
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-card/80 backdrop-blur-md border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : recentActivity.map((a: any, i: number) => {
              const initials = (a.user?.name || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div key={i} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground leading-snug">
                      {a.user?.name || "Student"} submitted {a.problem?.title || "a problem"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(a.submitted_at)}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Chart */}
      {classPerformance.length > 0 && (
        <Card className="bg-card/80 backdrop-blur-md border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Class Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
