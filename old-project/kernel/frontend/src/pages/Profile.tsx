import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  BookOpen, Flame, FileText, Award, Lock, CheckCircle,
  Zap, Globe, Target, Trophy, Star, Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Achievement } from "@/types/exam";
import { useStudentStats, useStudentPerformance } from "@/hooks/useStudentStats";
import { useStudentSubmissions } from "@/hooks/useSubmissions";
import { formatRelativeTime } from "@/lib/mappers";

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

const skills = [
  { topic: "Arrays", percent: 85 },
  { topic: "Strings", percent: 72 },
  { topic: "Trees", percent: 60 },
  { topic: "Dynamic Programming", percent: 45 },
  { topic: "Graphs", percent: 68 },
];

const achievements: Achievement[] = [
  { id: "1", name: "First Submit", description: "Submit your first exam", icon: "CheckCircle", maxProgress: 1, unlocked: true, earnedAt: "2025-09-15" },
  { id: "2", name: "Perfect Score", description: "Score 100% on any exam", icon: "Star", maxProgress: 1, unlocked: false, progress: 0 },
  { id: "3", name: "10 Exams Completed", description: "Complete 10 exams", icon: "Trophy", maxProgress: 10, progress: 0, unlocked: false },
  { id: "4", name: "Speed Demon", description: "Finish an exam in under half the time", icon: "Zap", maxProgress: 1, unlocked: false },
  { id: "5", name: "Polyglot", description: "Submit in 3 different languages", icon: "Globe", maxProgress: 3, progress: 0, unlocked: false },
  { id: "6", name: "Streak Master", description: "Maintain a 30-day streak", icon: "Flame", maxProgress: 30, progress: 0, unlocked: false },
  { id: "7", name: "Top 3", description: "Rank in the top 3 on the leaderboard", icon: "Target", maxProgress: 1, unlocked: false, progress: 0 },
  { id: "8", name: "Bookworm", description: "Complete all practice sets", icon: "BookOpen", maxProgress: 15, progress: 0, unlocked: false },
];

const iconMap: Record<string, React.ElementType> = {
  CheckCircle, Star, Trophy, Zap, Globe, Flame, Target, BookOpen,
};

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const name = user?.name ?? "";
  const email = user?.email ?? "";
  const role = user?.role ?? "student";
  const [tab, setTab] = useState("overview");

  const { data: statsData } = useStudentStats();
  const { data: perfData } = useStudentPerformance();
  const { data: subsData } = useStudentSubmissions();

  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const performanceData = (perfData || []).map((item: any) => {
    const monthNum = item.month?.split("-")[1] || "";
    return {
      month: MONTH_LABELS[monthNum] || item.month,
      score: Math.round(item.avg_score ?? 0),
    };
  });

  const submissions = (subsData || []).slice(0, 5).map((s: any) => ({
    id: s.id,
    exam: s.problem?.title || "Unknown",
    score: Math.round(s.score ?? 0),
    language: s.language || "—",
    date: s.submitted_at ? s.submitted_at.split("T")[0] : "—",
    status: s.status || "pending",
    exam_id: s.exam_id,
  }));

  const examsT = statsData?.exams_taken ?? 0;
  const avgS = Math.round(statsData?.avg_score ?? 0);
  const totalSub = statsData?.total_submissions ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card/80 backdrop-blur-md border-border/50">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{name}</h1>
              <Badge variant="secondary">{role === "teacher" ? "Teacher" : "Student"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard/settings")} className="gap-2">
            <Settings className="h-4 w-4" /> Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Exams Taken", value: String(examsT), icon: FileText },
          { label: "Average Score", value: `${avgS}%`, icon: Award },
          { label: "Total Submissions", value: String(totalSub), icon: CheckCircle },
          { label: "Pass Rate", value: `${Math.round(statsData?.pass_rate ?? 0)}%`, icon: Flame },
        ].map((s) => (
          <Card key={s.label} className="bg-card/80 backdrop-blur-md border-border/50">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-primary/10 p-3">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardHeader><CardTitle className="text-base">Performance Trend</CardTitle></CardHeader>
              <CardContent>
                {performanceData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No performance data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardHeader><CardTitle className="text-base">Skill Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {skills.map((s) => (
                  <div key={s.topic} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{s.topic}</span>
                      <span className="text-muted-foreground">{s.percent}%</span>
                    </div>
                    <Progress value={s.percent} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <Card className="bg-card/80 backdrop-blur-md border-border/50">
            <CardContent className="pt-6">
              {submissions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No submissions yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Problem</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((s: any) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/dashboard/exam/${s.exam_id}/review`)}
                      >
                        <TableCell className="font-medium text-foreground">{s.exam}</TableCell>
                        <TableCell className="text-foreground">{s.score}%</TableCell>
                        <TableCell className="text-muted-foreground">{s.language}</TableCell>
                        <TableCell className="text-muted-foreground">{s.date}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{s.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((a) => {
              const Icon = iconMap[a.icon] || Award;
              return (
                <Card key={a.id} className={`bg-card/80 backdrop-blur-md border-border/50 transition-all ${!a.unlocked ? "opacity-50 grayscale" : ""}`}>
                  <CardContent className="flex flex-col items-center text-center gap-3 pt-6">
                    <div className={`rounded-full p-3 ${a.unlocked ? "bg-primary/15" : "bg-muted"}`}>
                      {a.unlocked ? <Icon className="h-6 w-6 text-primary" /> : <Lock className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                    </div>
                    {a.unlocked ? (
                      <p className="text-xs text-primary">{a.earnedAt ? format(parseISO(a.earnedAt), "MMM d, yyyy") : ""}</p>
                    ) : (
                      <div className="w-full space-y-1">
                        <Progress value={((a.progress || 0) / a.maxProgress) * 100} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">{a.progress || 0}/{a.maxProgress}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
