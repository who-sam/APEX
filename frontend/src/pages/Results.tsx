import { useState, useEffect } from "react";
import { ClipboardCheck, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStudentSubmissions, getSubmission } from "@/lib/api";
import type { SubmissionData, TestResultData } from "@/lib/api";

const statusColor = (s: string) => {
  if (s === "accepted") return "bg-green-500/15 text-green-500 border-green-500/30";
  if (s === "wrong_answer") return "bg-destructive/15 text-destructive border-destructive/30";
  return "bg-accent/15 text-accent border-accent/30";
};

export default function ResultsPage() {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SubmissionData | null>(null);
  const [testResults, setTestResults] = useState<TestResultData[]>([]);

  useEffect(() => {
    getStudentSubmissions()
      .then(setSubmissions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleView = async (sub: SubmissionData) => {
    setSelected(sub);
    try {
      const data = await getSubmission(sub.id);
      setTestResults(data.test_results);
    } catch {
      setTestResults([]);
    }
  };

  const avg = submissions.length > 0
    ? Math.round(submissions.reduce((a, s) => a + s.score, 0) / submissions.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Results</h1>
        <p className="mt-1 text-muted-foreground">Review your submission history.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className="text-3xl font-bold text-foreground">{avg}%</p>
            <Progress value={avg} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Submissions</p>
            <p className="text-3xl font-bold text-foreground">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Best Score</p>
            <p className="text-3xl font-bold text-green-500">
              {submissions.length > 0 ? Math.max(...submissions.map(s => Math.round(s.score))) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Submission History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No submissions yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-secondary/40">
                    <TableCell className="font-medium">{s.problem?.title || `Problem #${s.problem_id}`}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(s.submitted_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">{s.language}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{Math.round(s.score)}%</span>
                        <Progress value={s.score} className="h-1.5 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(s.status)}>
                        {s.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="gap-1 text-primary" onClick={() => handleView(s)}>
                        <Eye className="h-3 w-3" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.problem?.title || "Submission Details"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-green-500/10 p-3">
                  <p className="text-2xl font-bold text-green-500">{selected.passed_count}</p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
                <div className="rounded-xl bg-destructive/10 p-3">
                  <p className="text-2xl font-bold text-destructive">{selected.total_count - selected.passed_count}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-2xl font-bold text-foreground">{Math.round(selected.score)}%</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>
              {testResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Test Results</p>
                  {testResults.filter(t => t.is_sample).map((t, i) => (
                    <div key={t.id} className={`rounded-lg border p-2 text-xs font-mono ${t.passed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                      <div>Input: {t.input}</div>
                      <div>Expected: {t.expected_output}</div>
                      <div>Got: <span className={t.passed ? "text-green-400" : "text-red-400"}>{t.actual_output}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
