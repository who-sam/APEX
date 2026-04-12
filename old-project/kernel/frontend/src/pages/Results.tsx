import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useStudentSubmissions } from "@/hooks/useSubmissions";
import { formatRelativeTime } from "@/lib/mappers";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function ResultsPage() {
  const navigate = useNavigate();
  const { data: submissions, isLoading } = useStudentSubmissions();

  const results = (submissions || []).map((sub: any) => ({
    id: sub.id,
    name: sub.problem?.title || "Unknown",
    date: formatRelativeTime(sub.submitted_at),
    score: Math.round(sub.score ?? 0),
    total: 100,
    status: sub.status || "pending",
    exam_id: sub.exam_id,
  }));

  const avg = results.length > 0 ? Math.round(results.reduce((a: number, r: any) => a + r.score, 0) / results.length) : 0;
  const best = results.length > 0 ? Math.max(...results.map((r: any) => r.score)) : 0;
  const bestName = results.find((r: any) => r.score === best)?.name || "—";

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Results</h1>
        <p className="mt-1 text-muted-foreground">Review your past exam performance.</p>
      </div>

      {/* Summary cards */}
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
            <p className="text-sm text-muted-foreground">Submissions</p>
            <p className="text-3xl font-bold text-foreground">{results.length}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {results.length > 0 ? `Last: ${results[0].date}` : "No submissions yet"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Best Score</p>
            <p className="text-3xl font-bold text-green-500">{best}%</p>
            <p className="text-xs text-muted-foreground mt-2">{bestName}</p>
          </CardContent>
        </Card>
      </div>

      {/* Results table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Submission History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No submissions yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r: any) => (
                  <TableRow key={r.id} className="hover:bg-secondary/40">
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{r.score}%</span>
                        <Progress value={r.score} className="h-1.5 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{r.status}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="gap-1 text-primary" onClick={() => navigate(`/dashboard/exam/${r.exam_id}/review`)}>
                        <Eye className="h-3 w-3" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
