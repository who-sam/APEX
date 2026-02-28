import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, CheckCircle2, AlertCircle } from "lucide-react";
import { getStudentSubmissions } from "@/lib/api";
import type { SubmissionData } from "@/lib/api";

export function RecentResults() {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);

  useEffect(() => {
    getStudentSubmissions()
      .then((data) => setSubmissions(data.slice(0, 5)))
      .catch(() => {});
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-accent" />
          Recent Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No submissions yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.problem?.title || `Problem #${s.problem_id}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(s.submitted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={s.score} className="h-2 w-16" />
                      <span className="text-sm font-medium">{Math.round(s.score)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {s.status === "accepted" ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Passed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">{s.status}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
