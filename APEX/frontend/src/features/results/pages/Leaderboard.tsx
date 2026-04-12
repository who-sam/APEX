import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useUser } from "@/contexts/AuthContext";
import type { LeaderboardEntry } from "@/features/results/types/leaderboard";

interface ExtendedEntry extends LeaderboardEntry {
  class: string;
  weekScore: number;
  monthScore: number;
}

const classEntries: ExtendedEntry[] = [
  { rank: 1, studentName: "Alice Chen", avatar: "AC", score: 96, examsCompleted: 24, streak: 30, trend: "up", class: "cs201", weekScore: 98, monthScore: 97 },
  { rank: 2, studentName: "Bob Kumar", avatar: "BK", score: 93, examsCompleted: 22, streak: 18, trend: "up", class: "cs201", weekScore: 90, monthScore: 92 },
  { rank: 3, studentName: "Carla Ruiz", avatar: "CR", score: 91, examsCompleted: 23, streak: 25, trend: "same", class: "cs201", weekScore: 85, monthScore: 89 },
  { rank: 4, studentName: "John Doe", avatar: "JD", score: 88, examsCompleted: 20, streak: 12, trend: "up", class: "cs201", weekScore: 92, monthScore: 88 },
  { rank: 5, studentName: "Emily Park", avatar: "EP", score: 85, examsCompleted: 21, streak: 8, trend: "down", class: "cs301", weekScore: 80, monthScore: 83 },
  { rank: 6, studentName: "Farhan Ali", avatar: "FA", score: 82, examsCompleted: 19, streak: 5, trend: "same", class: "cs301", weekScore: 78, monthScore: 80 },
  { rank: 7, studentName: "Grace Liu", avatar: "GL", score: 79, examsCompleted: 18, streak: 3, trend: "down", class: "cs101", weekScore: 75, monthScore: 77 },
  { rank: 8, studentName: "Henry Wu", avatar: "HW", score: 76, examsCompleted: 17, streak: 15, trend: "up", class: "cs101", weekScore: 82, monthScore: 78 },
];

const globalEntries: ExtendedEntry[] = [
  { rank: 1, studentName: "Mei Tanaka", avatar: "MT", score: 99, examsCompleted: 40, streak: 60, trend: "up", class: "all", weekScore: 100, monthScore: 99 },
  { rank: 2, studentName: "Alice Chen", avatar: "AC", score: 96, examsCompleted: 24, streak: 30, trend: "up", class: "all", weekScore: 98, monthScore: 97 },
  { rank: 3, studentName: "Raj Patel", avatar: "RP", score: 95, examsCompleted: 35, streak: 45, trend: "same", class: "all", weekScore: 93, monthScore: 94 },
  { rank: 4, studentName: "Bob Kumar", avatar: "BK", score: 93, examsCompleted: 22, streak: 18, trend: "up", class: "all", weekScore: 90, monthScore: 92 },
  { rank: 5, studentName: "Carla Ruiz", avatar: "CR", score: 91, examsCompleted: 23, streak: 25, trend: "down", class: "all", weekScore: 85, monthScore: 89 },
  { rank: 6, studentName: "John Doe", avatar: "JD", score: 88, examsCompleted: 20, streak: 12, trend: "up", class: "all", weekScore: 92, monthScore: 88 },
  { rank: 7, studentName: "Emily Park", avatar: "EP", score: 85, examsCompleted: 21, streak: 8, trend: "down", class: "all", weekScore: 80, monthScore: 83 },
  { rank: 8, studentName: "Farhan Ali", avatar: "FA", score: 82, examsCompleted: 19, streak: 5, trend: "same", class: "all", weekScore: 78, monthScore: 80 },
];

const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function filterAndSort(entries: ExtendedEntry[], classFilter: string, timeFilter: string, currentUserName: string) {
  let filtered = classFilter === "all" ? entries : entries.filter((e) => e.class === classFilter || e.class === "all");
  const scoreKey = timeFilter === "week" ? "weekScore" : timeFilter === "month" ? "monthScore" : "score";
  const sorted = [...filtered].sort((a, b) => b[scoreKey] - a[scoreKey]);
  return sorted.map((e, i) => ({ ...e, rank: i + 1, displayScore: e[scoreKey], isCurrentUser: e.studentName === currentUserName }));
}

function Podium({ entries }: { entries: (ExtendedEntry & { displayScore: number })[] }) {
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
            <p className="text-lg font-bold text-primary mt-1">{e.displayScore}%</p>
            {e.isCurrentUser && <Badge className="mt-1 text-xs">You</Badge>}
          </Card>
        );
      })}
    </div>
  );
}

function RankedTable({ entries }: { entries: (ExtendedEntry & { displayScore: number })[] }) {
  return (
    <Card className="bg-card/80 backdrop-blur-md border-border/50">
      <CardContent className="pt-6">
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
                <TableCell className="font-semibold text-foreground">{e.displayScore}%</TableCell>
                <TableCell className="text-muted-foreground">{e.examsCompleted}</TableCell>
                <TableCell className="text-muted-foreground">{e.streak}🔥</TableCell>
                <TableCell><TrendIcon trend={e.trend} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function Leaderboard() {
  const { name: userName } = useUser();
  const [selectedClass, setSelectedClass] = useState("cs201");
  const [classTimeFilter, setClassTimeFilter] = useState("all");
  const [globalTimeFilter, setGlobalTimeFilter] = useState("all");

  const filteredClass = useMemo(() => filterAndSort(classEntries, selectedClass, classTimeFilter, userName), [selectedClass, classTimeFilter, userName]);
  const filteredGlobal = useMemo(() => filterAndSort(globalEntries, "all", globalTimeFilter, userName), [globalTimeFilter, userName]);

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
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cs201">CS201 - Data Structures</SelectItem>
                <SelectItem value="cs301">CS301 - Algorithms</SelectItem>
                <SelectItem value="cs101">CS101 - Intro to CS</SelectItem>
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
          <Podium entries={filteredClass} />
          <RankedTable entries={filteredClass} />
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
          <Podium entries={filteredGlobal} />
          <RankedTable entries={filteredGlobal} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
