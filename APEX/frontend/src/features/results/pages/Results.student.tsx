import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, TrendingUp, TrendingDown, Minus, Eye, FileSearch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const results = [
  { id: 1, name: "HTML & CSS Basics", date: "Feb 10, 2026", score: 92, total: 100, grade: "A", trend: "up", time: "42 min", correct: 37, wrong: 3, skipped: 0, topics: { Layout: 95, Selectors: 88, Responsive: 93 } },
  { id: 2, name: "JavaScript ES6+", date: "Feb 05, 2026", score: 78, total: 100, grade: "B+", trend: "up", time: "85 min", correct: 31, wrong: 7, skipped: 2, topics: { Promises: 70, Closures: 82, "Arrow Fns": 90 } },
  { id: 3, name: "React Hooks", date: "Jan 28, 2026", score: 85, total: 100, grade: "A-", trend: "same", time: "68 min", correct: 34, wrong: 5, skipped: 1, topics: { useState: 95, useEffect: 80, useContext: 78 } },
  { id: 4, name: "TypeScript Generics", date: "Jan 20, 2026", score: 65, total: 100, grade: "C+", trend: "down", time: "110 min", correct: 26, wrong: 10, skipped: 4, topics: { "Type Guards": 60, Utility: 55, Inference: 80 } },
  { id: 5, name: "Git & Version Control", date: "Jan 15, 2026", score: 95, total: 100, grade: "A+", trend: "up", time: "30 min", correct: 38, wrong: 2, skipped: 0, topics: { Branching: 100, Merging: 90, Rebase: 95 } },
];

const gradeColor = (g: string) => {
  if (g.startsWith("A")) return "bg-green-500/15 text-green-500 border-green-500/30";
  if (g.startsWith("B")) return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export default function StudentResults() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<typeof results[0] | null>(null);
  const avg = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Results</h1>
        <p className="mt-1 text-muted-foreground">Review your past exam performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className="text-3xl font-bold text-foreground">{avg}%</p>
            <Progress value={avg} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Exams Taken</p>
            <p className="text-3xl font-bold text-foreground">{results.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Last: {results[0].date}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Best Score</p>
            <p className="text-3xl font-bold text-green-500">{Math.max(...results.map(r => r.score))}%</p>
            <p className="text-xs text-muted-foreground mt-2">{results.find(r => r.score === Math.max(...results.map(x => x.score)))?.name}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Exam History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-secondary/40" onClick={() => setSelected(r)}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.score}%</span>
                      <Progress value={r.score} className="h-1.5 w-16" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={gradeColor(r.grade)}>{r.grade}</Badge>
                  </TableCell>
                  <TableCell><TrendIcon trend={r.trend} /></TableCell>
                  <TableCell className="text-muted-foreground">{r.time}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="gap-1 text-primary" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>
                      <Eye className="h-3 w-3" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-green-500/10 p-3">
                  <p className="text-2xl font-bold text-green-500">{selected.correct}</p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="rounded-xl bg-destructive/10 p-3">
                  <p className="text-2xl font-bold text-destructive">{selected.wrong}</p>
                  <p className="text-xs text-muted-foreground">Wrong</p>
                </div>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-2xl font-bold text-muted-foreground">{selected.skipped}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Topic Breakdown</p>
                {Object.entries(selected.topics).map(([topic, score]) => (
                  <div key={topic} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">{topic}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={score} className="h-2 w-24" />
                      <span className="text-sm font-medium w-10 text-right">{score}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => { setSelected(null); navigate(`/dashboard/exam/${selected.id}/review`); }}
              >
                <FileSearch className="h-4 w-4" /> View Detailed Review
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
