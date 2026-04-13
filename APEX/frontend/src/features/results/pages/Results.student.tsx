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
import { useStudentSubmissions } from "@/hooks/useSubmissions";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { formatDistanceToNow } from "date-fns";

const statusColor = (status: string) => {
  if (status === "accepted") return "bg-green-500/15 text-green-500 border-green-500/30";
  if (status === "pending_review") return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

const statusLabel = (status: string) => {
  if (status === "accepted") return "Passed";
  if (status === "pending_review") return "Pending";
  if (status === "wrong_answer") return "Failed";
  return status;
};

export default function StudentResults() {
  const navigate = useNavigate();
  const { data: submissions, isLoading, error, refetch } = useStudentSubmissions();
  const [selected, setSelected] = useState<any | null>(null);

  if (isLoading) return <PageSkeleton cards={3} rows={5} />;
  if (error) return <ErrorState message="Failed to load results" onRetry={refetch} />;

  const results = submissions || [];

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
  const best = scores.length > 0 ? Math.round(Math.max(...scores)) : 0;

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
            <p className="text-sm text-muted-foreground">Total Submissions</p>
            <p className="text-3xl font-bold text-foreground">{results.length}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {results[0]?.submitted_at ? formatDistanceToNow(new Date(results[0].submitted_at), { addSuffix: true }) : ""}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Best Score</p>
            <p className="text-3xl font-bold text-green-500">{best}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Submission History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r: any) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-secondary/40" onClick={() => setSelected(r)}>
                  <TableCell className="font-medium">{r.problem?.title || `Problem #${r.problem_id}`}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.submitted_at ? formatDistanceToNow(new Date(r.submitted_at), { addSuffix: true }) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.score != null ? `${Math.round(r.score)}%` : "—"}</span>
                      {r.score != null && <Progress value={r.score} className="h-1.5 w-16" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(r.status)}>{statusLabel(r.status)}</Badge>
                  </TableCell>
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
            <DialogTitle>{selected?.problem?.title || `Submission #${selected?.id}`}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-primary/10 p-3">
                  <p className="text-2xl font-bold text-foreground">{selected.score != null ? `${Math.round(selected.score)}%` : "—"}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div className={`rounded-xl p-3 ${selected.status === "accepted" ? "bg-green-500/10" : "bg-destructive/10"}`}>
                  <p className={`text-lg font-bold ${selected.status === "accepted" ? "text-green-500" : "text-destructive"}`}>
                    {statusLabel(selected.status)}
                  </p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
              </div>
              {selected.language && (
                <p className="text-sm text-muted-foreground">Language: {selected.language}</p>
              )}
              {selected.submitted_at && (
                <p className="text-sm text-muted-foreground">
                  Submitted {formatDistanceToNow(new Date(selected.submitted_at), { addSuffix: true })}
                </p>
              )}
              {selected.exam_id && (
                <Button
                  className="w-full gap-2"
                  onClick={() => { setSelected(null); navigate(`/dashboard/exam/${selected.exam_id}/review`); }}
                >
                  <FileSearch className="h-4 w-4" /> View Exam Review
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
