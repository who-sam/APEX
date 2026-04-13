import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useUser } from "@/contexts/AuthContext";
import { useClassLeaderboard, useGlobalLeaderboard } from "@/hooks/useLeaderboard";
import { useStudentClasses } from "@/hooks/useClasses";
import { PageSkeleton } from "@/components/PageSkeleton";
import { EmptyState } from "@/components/EmptyState";

const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function Podium({ entries }: { entries: any[] }) {
  const top3 = entries.slice(0, 3);
  const order = [1, 0, 2];
  return (
    <div className="flex items-end justify-center gap-4 mb-6">
      {order.map((idx) => {
        const e = top3[idx];
        if (!e) return null;
        const isFirst = idx === 0;
        return (
          <Card key={e.rank || idx} className={`bg-card/80 backdrop-blur-md border-border/50 flex flex-col items-center p-4 ${isFirst ? "pb-8 -mt-4" : "pb-6"} w-36`}>
            <Medal className={`h-6 w-6 mb-2 ${medalColors[idx]}`} />
            <Avatar className="h-12 w-12 mb-2">
              <AvatarFallback className="bg-primary/20 font-semibold text-primary">
                {getInitials(e.student_name || e.name || "?")}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm text-foreground text-center">{e.student_name || e.name}</p>
            <p className="text-lg font-bold text-primary mt-1">{e.score || e.avg_score || 0}%</p>
            {e.is_current_user && <Badge className="mt-1 text-xs">You</Badge>}
          </Card>
        );
      })}
    </div>
  );
}

function RankedTable({ entries, userName }: { entries: any[]; userName: string }) {
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
            {entries.map((e: any, i: number) => {
              const rank = e.rank || i + 1;
              const isCurrentUser = e.is_current_user || (e.student_name || e.name) === userName;
              return (
                <TableRow key={e.user_id || i} className={isCurrentUser ? "border border-primary/30 bg-primary/5" : ""}>
                  <TableCell className="font-bold text-foreground">
                    {rank <= 3 ? <Medal className={`h-4 w-4 inline ${medalColors[rank - 1]}`} /> : `#${rank}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                          {getInitials(e.student_name || e.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{e.student_name || e.name}</span>
                      {isCurrentUser && <Badge variant="secondary" className="text-xs">You</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{e.score || e.avg_score || 0}%</TableCell>
                  <TableCell className="text-muted-foreground">{e.exams_completed || e.exams || 0}</TableCell>
                  <TableCell className="text-muted-foreground">{e.streak || 0}</TableCell>
                  <TableCell><TrendIcon trend={e.trend || "same"} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function Leaderboard() {
  const { name: userName } = useUser();
  const { data: classes } = useStudentClasses();
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [classTimeFilter, setClassTimeFilter] = useState("all");
  const [globalTimeFilter, setGlobalTimeFilter] = useState("all");

  const { data: classLeaderboard, isLoading: classLoading } = useClassLeaderboard(selectedClassId, classTimeFilter);
  const { data: globalLeaderboard, isLoading: globalLoading } = useGlobalLeaderboard(globalTimeFilter);

  const classList = classes || [];
  const classEntries = classLeaderboard || [];
  const globalEntries = globalLeaderboard || [];

  // Auto-select first class
  if (selectedClassId === 0 && classList.length > 0) {
    setSelectedClassId(classList[0].id);
  }

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
            <Select value={String(selectedClassId)} onValueChange={(v) => setSelectedClassId(Number(v))}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classList.map((c: any) => (
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
          {classLoading ? (
            <PageSkeleton rows={5} />
          ) : classEntries.length === 0 ? (
            <EmptyState icon={Medal} title="No data" description="No leaderboard entries for this class yet." />
          ) : (
            <>
              <Podium entries={classEntries} />
              <RankedTable entries={classEntries} userName={userName} />
            </>
          )}
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
          {globalLoading ? (
            <PageSkeleton rows={5} />
          ) : globalEntries.length === 0 ? (
            <EmptyState icon={Medal} title="No data" description="No global leaderboard entries yet." />
          ) : (
            <>
              <Podium entries={globalEntries} />
              <RankedTable entries={globalEntries} userName={userName} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
