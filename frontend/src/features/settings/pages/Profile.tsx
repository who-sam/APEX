import { useState } from "react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BookOpen, FileText, Award, Lock, CheckCircle,
  Zap, Globe, Target, Trophy, Star, Settings, Hash, Users, GraduationCap,
} from "lucide-react";
import { useUser, useRole, useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useStudentStats } from "@/hooks/useStudentStats";
import { useStudentSubmissions } from "@/hooks/useSubmissions";
import { useStudentClasses, useClasses } from "@/hooks/useClasses";
import { useTeacherDashboard } from "@/hooks/useTeacherDashboard";
import type { Achievement } from "@/features/settings/types/achievement";

const iconMap: Record<string, React.ElementType> = {
  CheckCircle, Star, Trophy, Zap, Globe, Target, BookOpen,
};

/* ── Static achievements (until backend supports them) ── */
const defaultAchievements: Achievement[] = [
  { id: "1", name: "First Submit", description: "Submit your first exam", icon: "CheckCircle", maxProgress: 1, unlocked: true, earnedAt: "2025-09-15" },
  { id: "2", name: "Perfect Score", description: "Score 100% on any exam", icon: "Star", maxProgress: 1, unlocked: true, earnedAt: "2025-11-20" },
  { id: "3", name: "10 Exams Completed", description: "Complete 10 exams", icon: "Trophy", maxProgress: 10, progress: 8, unlocked: false },
  { id: "4", name: "Speed Demon", description: "Finish an exam in under half the time", icon: "Zap", maxProgress: 1, unlocked: true, earnedAt: "2026-02-27" },
  { id: "5", name: "Polyglot", description: "Submit in 3 different languages", icon: "Globe", maxProgress: 3, progress: 3, unlocked: true, earnedAt: "2026-01-10" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { firstName, lastName, name, email } = useUser();
  const { role } = useRole();
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const isTeacher = role === "teacher";

  const { data: profileData } = useProfile();
  const profilePhoto = profileData?.profile?.avatar_url || null;
  const { data: studentStatsData } = useStudentStats();
  const { data: teacherDash } = useTeacherDashboard();
  const { data: submissions } = useStudentSubmissions();
  const { data: studentClasses } = useStudentClasses();
  const { data: teacherClasses } = useClasses();

  const initials = [firstName, lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  const statsCards = isTeacher
    ? [
        { label: "Courses", value: String(teacherDash?.total_classes || 0), icon: BookOpen },
        { label: "Students", value: String(teacherDash?.total_students || 0), icon: Users },
        { label: "Exams Created", value: String(teacherDash?.active_exams || 0), icon: FileText },
      ]
    : [
        { label: "Exams Taken", value: String(studentStatsData?.exams_taken || 0), icon: FileText },
        { label: "Average Score", value: `${studentStatsData?.avg_score?.toFixed(0) || 0}%`, icon: Award },
        { label: "Total Submissions", value: String(studentStatsData?.total_submissions || 0), icon: CheckCircle },
      ];

  const recentSubmissions = (submissions || []).slice(0, 5);
  const classes = isTeacher ? (teacherClasses || []) : (studentClasses || []);

  const recentActivity = isTeacher
    ? (teacherDash?.recent_activity || []).slice(0, 5)
    : recentSubmissions.map((s: any) => ({
        text: `${s.status === "accepted" ? "Passed" : s.status} — Score: ${s.score?.toFixed(0) || 0}%`,
        time: s.submitted_at ? formatDistanceToNow(new Date(s.submitted_at), { addSuffix: true }) : "",
      }));

  // TODO: replace with API achievements when backend supports them
  const achievements = defaultAchievements;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card/80 backdrop-blur-md border-border/50">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-6">
          <Avatar className="h-20 w-20">
            {profilePhoto && <AvatarImage src={profilePhoto} alt="Profile" />}
            <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{name || "Unknown"}</h1>
              <Badge variant="secondary" className="flex items-center gap-1">
                {isTeacher ? <GraduationCap className="h-3 w-3" /> : null}
                {isTeacher ? "Teacher" : "Student"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{email}</p>
            {!isTeacher && user?.id && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                <span>Student ID: <span className="font-mono font-medium text-foreground">{user.id}</span></span>
              </div>
            )}
            {profileData?.user?.created_at ? (
              <p className="text-sm text-muted-foreground">
                Member since {format(new Date(profileData.user.created_at), "MMMM yyyy")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Member since --</p>
            )}
            {profileData?.profile?.bio && (
              <p className="text-sm text-foreground/80 mt-2">{profileData.profile.bio}</p>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard/settings")} className="gap-2">
            <Settings className="h-4 w-4" /> Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((s) => (
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
          {!isTeacher && <TabsTrigger value="submissions">Submissions</TabsTrigger>}
          {!isTeacher && <TabsTrigger value="achievements">Achievements</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    recentActivity.map((a: any, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                        <div>
                          <p className="text-sm text-foreground">{a.text || a.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.time || (a.timestamp ? formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }) : "")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardHeader><CardTitle className="text-base">{isTeacher ? "Teaching Courses" : "Classes Enrolled"}</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No courses yet.</p>
                ) : (
                  classes.map((c: any) => (
                    <Badge key={c.id} variant="secondary">{c.name}</Badge>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {!isTeacher && (
          <TabsContent value="submissions" className="mt-4">
            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardContent className="pt-6">
                {recentSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No submissions yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Name</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSubmissions.map((s: any) => (
                        <TableRow
                          key={s.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/dashboard/exam/${s.exam_id || s.id}/review`)}
                        >
                          <TableCell className="font-medium text-foreground">
                            {s.exam?.title || s.problem?.title || `Exam #${s.exam_id || s.problem_id || s.id}`}
                          </TableCell>
                          <TableCell className="text-foreground">{s.score != null ? `${Math.round(s.score)}%` : "---"}</TableCell>
                          <TableCell className="text-muted-foreground">{s.language || "---"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {s.submitted_at ? format(new Date(s.submitted_at), "yyyy-MM-dd") : "---"}
                          </TableCell>
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
        )}

        {!isTeacher && (
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
                          <p className="text-xs text-muted-foreground">{a.progress}/{a.maxProgress}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
