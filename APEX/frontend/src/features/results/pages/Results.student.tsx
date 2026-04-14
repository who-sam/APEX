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
import { useMyAttempts } from "@/hooks/useAttempts";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { formatDistanceToNow } from "date-fns";

const gradeColor = (g: string) => {
  if (g.startsWith("A")) return "bg-green-500/15 text-green-500 border-green-500/30";
  if (g.startsWith("B")) return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

function scoreToGrade(score: number): string {
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 60) return "D";
  return "F";
}

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

function computeTrend(results: any[], index: number): string {
  if (index >= results.length - 1) return "same";
  const current = results[index].score;
  const prev = results[index + 1].score;
  if (current == null || prev == null) return "same";
  if (current > prev) return "up";
  if (current < prev) return "down";
  return "same";
}

export default function StudentResults() {
  const navigate = useNavigate();
  const { data: attempts, isLoading, error, refetch } = useMyAttempts();
  const [selected, setSelected] = useState<any | null>(null);

  if (isLoading) return <PageSkeleton cards={3} rows={5} />;
  if (error) return <ErrorState message="Failed to load results" onRetry={refetch} />;

  const results: any[] = (attempts || []).map((a: any) => ({
    id: a.id,
    exam_id: a.exam_id,
    exam: a.exam,
    score: a.score,
    submitted_at: a.submitted_at || a.started_at,
    status: a.status,
    submissions: a.submissions || [],
  }));

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Results</h1>
          <p className="mt-1 text-muted-foreground">Review your past exam performance.</p>
        </div>
        <EmptyState icon={ClipboardCheck} title="No results yet" description="Complete an exam to see your results here." />
      </div>
    );
  }

  const scores = results.filter((r: any) => r.score != null).map((r: any) => r.score);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, s: number) => a + s, 0) / scores.length) : 0;
  const best = scores.length > 0 ? Math.max(...scores) : 0;
  const bestResult = results.find((r: any) => r.score === best);

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
            <p className="text-xs text-muted-foreground mt-2">
              Last: {results[0]?.submitted_at ? formatDistanceToNow(new Date(results[0].submitted_at), { addSuffix: true }) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Best Score</p>
            <p className="text-3xl font-bold text-green-500">{Math.round(best)}%</p>
            <p className="text-xs text-muted-foreground mt-2">{bestResult?.problem?.title || bestResult?.exam?.title || ""}</p>
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
              {results.map((r: any, idx: number) => {
                const score = r.score != null ? Math.round(r.score) : null;
                const grade = score != null ? scoreToGrade(score) : "—";
                const trend = computeTrend(results, idx);
                const time = r.duration_minutes ? `${r.duration_minutes} min` : r.submitted_at ? formatDistanceToNow(new Date(r.submitted_at), { addSuffix: true }) : "—";
                return (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-secondary/40" onClick={() => setSelected(r)}>
                    <TableCell className="font-medium">{r.problem?.title || r.exam?.title || `Submission #${r.id}`}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{score != null ? `${score}%` : "—"}</span>
                        {score != null && <Progress value={score} className="h-1.5 w-16" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={gradeColor(grade)}>{grade}</Badge>
                    </TableCell>
                    <TableCell><TrendIcon trend={trend} /></TableCell>
                    <TableCell className="text-muted-foreground">{time}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="gap-1 text-primary" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>
                        <Eye className="h-3 w-3" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.problem?.title || selected?.exam?.title || `Submission #${selected?.id}`}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-green-500/10 p-3">
                  <p className="text-2xl font-bold text-green-500">{selected.correct_count ?? (selected.score != null ? Math.round(selected.score) : "—")}</p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="rounded-xl bg-destructive/10 p-3">
                  <p className="text-2xl font-bold text-destructive">{selected.wrong_count ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Wrong</p>
                </div>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-2xl font-bold text-muted-foreground">{selected.skipped_count ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
              </div>
              {selected.topics && Object.keys(selected.topics).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Topic Breakdown</p>
                  {Object.entries(selected.topics).map(([topic, score]) => (
                    <div key={topic} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">{topic}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={score as number} className="h-2 w-24" />
                        <span className="text-sm font-medium w-10 text-right">{score as number}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selected.language && (
                <p className="text-sm text-muted-foreground">Language: {selected.language}</p>
              )}
              {selected.submitted_at && (
                <p className="text-sm text-muted-foreground">
                  Submitted {formatDistanceToNow(new Date(selected.submitted_at), { addSuffix: true })}
                </p>
              )}
              <Button
                className="w-full gap-2"
                onClick={() => { setSelected(null); navigate(`/dashboard/exam/${selected.exam_id || selected.id}/review`); }}
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
