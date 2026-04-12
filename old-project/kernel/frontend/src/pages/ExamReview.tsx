import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle, XCircle, Check, X } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { getExamResults } from "@/lib/api";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function ExamReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const examId = Number(id);

  const { data: results, isLoading } = useQuery({
    queryKey: ["exam-results", examId],
    queryFn: () => getExamResults(examId),
    enabled: !!examId && !isNaN(examId),
  });

  if (isLoading) return <PageSkeleton />;

  if (!results || (Array.isArray(results) && results.length === 0)) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard/results")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Results
        </Button>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">No Results Yet</h2>
            <p className="text-sm text-muted-foreground">No submissions have been recorded for this exam.</p>
          </div>
        </div>
      </div>
    );
  }

  // Results is an array of student results
  const studentResults: any[] = Array.isArray(results) ? results : [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/dashboard/results")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Results
      </Button>

      <h1 className="text-2xl font-bold text-foreground">Exam Review</h1>

      {studentResults.map((sr: any) => {
        const totalScore = Math.round(sr.total_score ?? 0);
        const avgScore = Math.round(sr.avg_score ?? 0);
        return (
          <Card key={sr.user_id} className="bg-card/80 backdrop-blur-md border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{sr.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{sr.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{totalScore} pts</p>
                  <p className="text-sm text-muted-foreground">Avg: {avgScore}%</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sr.submissions && sr.submissions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Problem</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sr.submissions.map((sub: any) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.problem?.title || "—"}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{sub.type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{Math.round(sub.score ?? 0)}</span>
                            <Progress value={sub.score ?? 0} className="h-1.5 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.status === "passed" || sub.status === "accepted" ? "default" : "secondary"} className="capitalize">
                            {sub.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No submissions</p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Button variant="ghost" onClick={() => navigate("/dashboard/results")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Results
      </Button>
    </div>
  );
}
