import { useState } from "react";
import { format, parseISO } from "date-fns";
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
import { useUser, useRole } from "@/contexts/AuthContext";
import type { Achievement } from "@/features/settings/types/achievement";

/* ── Student data ── */
const studentActivity = [
  { text: "Submitted Midterm Exam", time: "2 hours ago" },
  { text: "Achieved 'Speed Demon' badge", time: "1 day ago" },
  { text: "Completed Practice Set #12", time: "2 days ago" },
  { text: "Joined class CS301", time: "5 days ago" },
  { text: "Scored 95% on Quiz 3", time: "1 week ago" },
];

const studentSubmissions = [
  { id: "mid-cs201", exam: "Midterm CS201", score: 88, language: "Python", date: "2026-02-28", status: "graded" },
  { id: "quiz-3", exam: "Quiz 3 - Arrays", score: 95, language: "JavaScript", date: "2026-02-20", status: "graded" },
  { id: "practice-12", exam: "Practice Set #12", score: 72, language: "C++", date: "2026-02-18", status: "graded" },
  { id: "pop-strings", exam: "Pop Quiz - Strings", score: 60, language: "Python", date: "2026-02-10", status: "graded" },
  { id: "final-cs101", exam: "Final CS101", score: 91, language: "Java", date: "2026-01-15", status: "graded" },
];

const achievements: Achievement[] = [
  { id: "1", name: "First Submit", description: "Submit your first exam", icon: "CheckCircle", maxProgress: 1, unlocked: true, earnedAt: "2025-09-15" },
  { id: "2", name: "Perfect Score", description: "Score 100% on any exam", icon: "Star", maxProgress: 1, unlocked: true, earnedAt: "2025-11-20" },
  { id: "3", name: "10 Exams Completed", description: "Complete 10 exams", icon: "Trophy", maxProgress: 10, progress: 8, unlocked: false },
  { id: "4", name: "Speed Demon", description: "Finish an exam in under half the time", icon: "Zap", maxProgress: 1, unlocked: true, earnedAt: "2026-02-27" },
  { id: "5", name: "Polyglot", description: "Submit in 3 different languages", icon: "Globe", maxProgress: 3, progress: 3, unlocked: true, earnedAt: "2026-01-10" },
  { id: "6", name: "Top 3", description: "Rank in the top 3 on the leaderboard", icon: "Target", maxProgress: 1, unlocked: false, progress: 0 },
  { id: "7", name: "Bookworm", description: "Complete all practice sets", icon: "BookOpen", maxProgress: 15, progress: 12, unlocked: false },
];

const iconMap: Record<string, React.ElementType> = {
  CheckCircle, Star, Trophy, Zap, Globe, Target, BookOpen,
};

/* ── Teacher data ── */
const teacherActivity = [
  { text: "Graded Midterm — Data Structures", time: "1 hour ago" },
  { text: "Published Quiz 3 results for CS301", time: "3 hours ago" },
  { text: "Created new exam: Final — OOP Concepts", time: "1 day ago" },
  { text: "Added 5 students to CS201-A", time: "2 days ago" },
  { text: "Updated course materials for CS101", time: "3 days ago" },
];

const teacherStats = [
  { label: "Courses", value: "8", icon: BookOpen },
  { label: "Students", value: "248", icon: Users },
  { label: "Exams Created", value: "32", icon: FileText },
];

const studentStats = [
  { label: "Exams Taken", value: "24", icon: FileText },
  { label: "Average Score", value: "82%", icon: Award },
  { label: "Total Submissions", value: "47", icon: CheckCircle },
];

export default function Profile() {
  const navigate = useNavigate();
  const { firstName, middleName, lastName, studentId, name, email, profilePhoto } = useUser();
  const { role } = useRole();
  const [tab, setTab] = useState("overview");
  const isTeacher = role === "teacher";

  const initials = [firstName, lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

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
            {!isTeacher && studentId && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                <span>Student ID: <span className="font-mono font-medium text-foreground">{studentId}</span></span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">Member since September 2025</p>
            <p className="text-sm text-foreground/80 mt-2">
              {isTeacher
                ? "Computer Science professor specializing in data structures and algorithms."
                : "Passionate about algorithms and competitive programming. Currently studying CS at MIT."}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard/settings")} className="gap-2">
            <Settings className="h-4 w-4" /> Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {(isTeacher ? teacherStats : studentStats).map((s) => (
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
                  {(isTeacher ? teacherActivity : studentActivity).map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div>
                        <p className="text-sm text-foreground">{a.text}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardHeader><CardTitle className="text-base">{isTeacher ? "Teaching Courses" : "Classes Enrolled"}</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(isTeacher
                  ? ["CS101 - Intro to CS", "CS201 - Data Structures", "CS301 - Algorithms", "CS401 - Machine Learning", "MATH201 - Discrete Math"]
                  : ["CS101 - Intro to CS", "CS201 - Data Structures", "CS301 - Algorithms", "MATH201 - Discrete Math"]
                ).map((c) => (
                  <Badge key={c} variant="secondary">{c}</Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {!isTeacher && (
          <TabsContent value="submissions" className="mt-4">
            <Card className="bg-card/80 backdrop-blur-md border-border/50">
              <CardContent className="pt-6">
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
                    {studentSubmissions.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/dashboard/exam/${s.id}/review`)}
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
