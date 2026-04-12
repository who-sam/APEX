import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClassLeaderboard, useGlobalLeaderboard } from "@/hooks/useLeaderboard";
import { useClasses } from "@/hooks/useClasses";
import { useStudentClasses } from "@/hooks/useClasses";

interface DisplayEntry {
  rank: number;
  studentName: string;
  avatar: string;
  score: number;
  examsCompleted: number;
  streak: number;
  trend: "up" | "down" | "same";
  isCurrentUser?: boolean;
}

const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function mapEntries(raw: any[], currentUserId: number | undefined): DisplayEntry[] {
  return (raw || []).map((e: any, i: number) => ({
    rank: e.rank ?? i + 1,
    studentName: e.student_name || "Unknown",
    avatar: (e.student_name || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    score: Math.round(e.score ?? 0),
    examsCompleted: e.exams_completed ?? 0,
    streak: e.streak ?? 0,
    trend: (e.trend as "up" | "down" | "same") || "same",
    isCurrentUser: currentUserId ? e.user_id === currentUserId : false,
  }));
}

function Podium({ entries }: { entries: DisplayEntry[] }) {
  const top3 = entries.slice(0, 3);
  const order = [1, 0, 2];
  return (
    <div className="flex items-end justify-center gap-4 mb-6">
      {order.map((idx) => {
        const e = top3[idx];
        if (!e) return null;
        const isFirst = idx === 0;
        return (
          <Card key={e.rank} className={`bg-card/80 backdrop-blur-md border-border/50 flex flex-col items-center p-4 ${isFirst ? "pb-8 -mt-4" : "pb-6"} w-36`}>
            <Medal className={`h-6 w-6 mb-2 ${medalColors[idx]}`} />
            <Avatar className="h-12 w-12 mb-2">
              <AvatarFallback className="bg-primary/20 font-semibold text-primary">{e.avatar}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm text-foreground text-center">{e.studentName}</p>
            <p className="text-lg font-bold text-primary mt-1">{e.score}%</p>
            {e.isCurrentUser && <Badge className="mt-1 text-xs">You</Badge>}
          </Card>
        );
      })}
    </div>
  );
}

function RankedTable({ entries }: { entries: DisplayEntry[] }) {
  return (
    <Card className="bg-card/80 backdrop-blur-md border-border/50">
      <CardContent className="pt-6">
        {entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No leaderboard data yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Exams</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead className="w-16">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.studentName + e.rank} className={e.isCurrentUser ? "border border-primary/30 bg-primary/5" : ""}>
                  <TableCell className="font-bold text-foreground">
                    {e.rank <= 3 ? <Medal className={`h-4 w-4 inline ${medalColors[e.rank - 1]}`} /> : `#${e.rank}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">{e.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{e.studentName}</span>
                      {e.isCurrentUser && <Badge variant="secondary" className="text-xs">You</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{e.score}%</TableCell>
                  <TableCell className="text-muted-foreground">{e.examsCompleted}</TableCell>
                  <TableCell className="text-muted-foreground">{e.streak > 0 ? `${e.streak}🔥` : "0"}</TableCell>
                  <TableCell><TrendIcon trend={e.trend} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const { data: teacherClasses } = useClasses();
  const { data: studentClasses } = useStudentClasses();
  const classes = isTeacher ? (teacherClasses || []) : (studentClasses || []);

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classTimeFilter, setClassTimeFilter] = useState("all");
  const [globalTimeFilter, setGlobalTimeFilter] = useState("all");

  // Set default class when loaded
  const classId = selectedClass ? Number(selectedClass) : (classes[0]?.id ?? 0);

  const { data: classData } = useClassLeaderboard(classId, classTimeFilter);
  const { data: globalData } = useGlobalLeaderboard(globalTimeFilter);

  const classEntries = mapEntries(classData || [], user?.id);
  const globalEntries = mapEntries(globalData || [], user?.id);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>

      <Tabs defaultValue="class">
        <TabsList>
          <TabsTrigger value="class">Class Leaderboard</TabsTrigger>
          <TabsTrigger value="global">Global Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="class" className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedClass || String(classId)} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 rounded-full border border-border bg-card/80 px-1 py-0.5 backdrop-blur-md">
              {["week", "month", "all"].map((f) => (
                <button
                  key={f}
                  onClick={() => setClassTimeFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${classTimeFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f === "week" ? "This Week" : f === "month" ? "This Month" : "All Time"}
                </button>
              ))}
            </div>
          </div>
          {classEntries.length >= 3 && <Podium entries={classEntries} />}
          <RankedTable entries={classEntries} />
        </TabsContent>

        <TabsContent value="global" className="mt-4 space-y-4">
          <div className="flex gap-1 rounded-full border border-border bg-card/80 px-1 py-0.5 backdrop-blur-md w-fit">
            {["week", "month", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setGlobalTimeFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${globalTimeFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f === "week" ? "This Week" : f === "month" ? "This Month" : "All Time"}
              </button>
            ))}
          </div>
          {globalEntries.length >= 3 && <Podium entries={globalEntries} />}
          <RankedTable entries={globalEntries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
