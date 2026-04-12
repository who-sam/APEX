import { useState } from "react";
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
  Users, FileText, GraduationCap, TrendingUp, TrendingDown,
  Plus, BarChart3, BookOpen, Clock, MoreHorizontal, Eye, Pencil, Trash2,
  ClipboardCheck,
} from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { useUser } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const stats = [
  { label: "Total Students", value: "248", icon: Users, trend: "+12%", up: true },
  { label: "Active Exams", value: "5", icon: FileText, trend: "+2", up: true },
  { label: "Classes", value: "8", icon: GraduationCap, trend: "0", up: true },
];

const quickActions = [
  { label: "Create Exam", desc: "Build a new exam", icon: Plus, route: "/dashboard/exam-builder" },
  { label: "Create Course", desc: "Start a new course", icon: BookOpen, route: "/dashboard/courses", state: { openCreate: true } },
  { label: "View Results", desc: "Check submissions", icon: BarChart3, route: "/dashboard/results" },
  { label: "Question Bank", desc: "Manage questions", icon: BookOpen, route: "/dashboard/question-bank" },
];

const initialActiveExams = [
  { id: "mid-ds", name: "Midterm — Data Structures", className: "CS201-A", started: 18, total: 32, remaining: "1h 23m", status: "active" },
  { id: "quiz-alg", name: "Quiz 3 — Algorithms", className: "CS301-B", started: 25, total: 28, remaining: "45m", status: "active" },
  { id: "final-oop", name: "Final — OOP Concepts", className: "CS101-A", started: 0, total: 45, remaining: "Starts in 2d", status: "scheduled" },
];

const activeCourses = [
  { id: "APX-CS101", name: "CS101 — Intro to Programming", students: 45, exams: 3, image: "https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=400&h=200&fit=crop" },
  { id: "APX-CS201", name: "CS201 — Data Structures", students: 38, exams: 5, image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=200&fit=crop" },
  { id: "APX-CS301", name: "CS301 — Algorithms", students: 32, exams: 2, image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop" },
];

const pendingGrading = [
  { examName: "Quiz 3 — Algorithms", course: "CS301-B", pending: 12, total: 28, type: "written" },
  { examName: "Midterm — Data Structures", course: "CS201-A", pending: 5, total: 32, type: "written" },
  { examName: "Lab 2 — Linked Lists", course: "CS201-A", pending: 8, total: 38, type: "coding" },
];

const recentActivity = [
  { avatar: "AS", text: "Ahmed S. submitted Midterm — Data Structures", time: "5 min ago" },
  { avatar: "MK", text: "New student Maria K. joined CS201-A", time: "12 min ago" },
  { avatar: "JD", text: "Quiz 3 grading completed for CS301-B", time: "1 hour ago" },
  { avatar: "LP", text: "Liam P. flagged question 4 in Quiz 3", time: "2 hours ago" },
  { avatar: "SR", text: "Sara R. achieved perfect score on Quiz 2", time: "3 hours ago" },
];

const classPerformance = [
  { name: "CS101-A", avg: 72, students: 45, trend: -3 },
  { name: "CS201-A", avg: 78, students: 38, trend: 5 },
  { name: "CS201-B", avg: 65, students: 30, trend: -8 },
  { name: "CS301-A", avg: 81, students: 32, trend: 2 },
  { name: "CS301-B", avg: 74, students: 28, trend: 1 },
  { name: "CS401-A", avg: 88, students: 22, trend: 4 },
];

const getBarColor = (avg: number) => {
  if (avg >= 80) return "hsl(142, 71%, 45%)";
  if (avg >= 70) return "hsl(var(--primary))";
  return "hsl(0, 84%, 60%)";
};

const classAvg = Math.round(classPerformance.reduce((s, c) => s + c.avg, 0) / classPerformance.length);

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { name } = useUser();
  const { toast } = useToast();
  const [activeExams, setActiveExams] = useState(initialActiveExams);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {name}</h1>
        <p className="text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <span className={`flex items-center text-xs font-medium ${s.up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {s.up ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                    {s.trend}
                  </span>
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
            {activeCourses.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/dashboard/courses/${c.id}`)}
                className="flex items-center gap-3 rounded-lg border border-border/30 p-3 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  className="h-12 w-20 rounded-md object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.students} students • {c.exams} exams</p>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px] shrink-0">{c.id}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Grading */}
        <Card className="lg:col-span-2 bg-card/80 backdrop-blur-md border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingGrading.map((g, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border/30 p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => navigate("/dashboard/grade-written")}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{g.examName}</p>
                  <p className="text-xs text-muted-foreground">{g.course}</p>
                </div>
                <Badge variant="destructive" className="text-[10px] shrink-0">
                  {g.pending} pending
                </Badge>
              </div>
            ))}
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
                  {activeExams.map((e) => (
                    <tr key={e.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{e.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{e.className}</td>
                      <td className="px-3 py-3 text-muted-foreground">{e.started}/{e.total}</td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" /> {e.remaining}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={e.status === "active" ? "default" : "secondary"} className="rounded-full text-xs capitalize">
                          {e.status}
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
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/exam/${e.id}/review`)} className="gap-2">
                              <Eye className="h-4 w-4" /> Preview as Student
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/dashboard/exam-builder")} className="gap-2">
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate("/dashboard/results")} className="gap-2">
                              <BarChart3 className="h-4 w-4" /> View Results
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setActiveExams(prev => prev.filter(x => x.id !== e.id)); toast({ title: "Exam deleted", description: `${e.name} has been deleted.` }); }} className="gap-2 text-destructive focus:text-destructive">
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
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">{a.avatar}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm text-foreground leading-snug">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Chart */}
      <Card className="bg-card/80 backdrop-blur-md border-border/50 max-w-4xl">
        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-semibold">Class Performance</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Average scores across all sections</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(142, 71%, 45%)" }} />≥ 80%</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" />70–79%</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(0, 84%, 60%)" }} />&lt; 70%</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPerformance} barCategoryGap="20%">
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
                    const trendIcon = entry.trend > 0 ? "↑" : entry.trend < 0 ? "↓" : "→";
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
                  {classPerformance.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.avg)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
