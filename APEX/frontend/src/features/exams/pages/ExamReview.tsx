import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle, XCircle, Check, X } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useStudentExam } from "@/hooks/useExams";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";

function parseJSON(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export default function ExamReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const examId = Number(id);
  const { data, isLoading, error, refetch } = useStudentExam(examId);

  if (isLoading) return <PageSkeleton cards={2} rows={5} />;
  if (error) return <ErrorState message="Failed to load exam review" onRetry={refetch} />;

  const exam = data?.exam;
  const submissions: any[] = data?.submissions || [];

  if (!exam) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard/results")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Results
        </Button>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">Review Not Found</h2>
            <p className="text-sm text-muted-foreground">No review data available for this exam.</p>
          </div>
        </div>
      </div>
    );
  }

  const problems: any[] = exam.problems || [];
  const totalPoints = problems.reduce((s: number, p: any) => s + (p.points || 0), 0);

  // Build submission map: problem_id -> submission
  const subMap = new Map<number, any>();
  for (const s of submissions) {
    subMap.set(s.problem_id, s);
  }

  const earnedTotal = submissions.reduce((s: number, sub: any) => s + (sub.score || 0), 0);
  const percentage = totalPoints > 0 ? Math.round((earnedTotal / totalPoints) * 100) : 0;
  const passed = percentage >= (exam.passing_score || 50);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/dashboard/results")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Results
      </Button>

      {/* Summary */}
      <Card className="bg-card/80 backdrop-blur-md border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">{exam.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={passed ? "default" : "destructive"}>{passed ? "Passed" : "Failed"}</Badge>
                <span className="text-sm text-muted-foreground">{submissions.length} submissions</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary">{Math.round(earnedTotal)}/{totalPoints}</p>
              <p className="text-sm text-muted-foreground">{percentage}%</p>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your score</span>
              <span className="text-muted-foreground">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {problems.map((p: any, i: number) => {
          const sub = subMap.get(p.id);
          const earned = sub?.score ?? 0;
          const options = parseJSON(p.options, []);
          const correctIds = parseJSON(p.correct_option_ids, []);
          const selectedIds = parseJSON(sub?.selected_options, []);

          return (
            <Card key={p.id} className="bg-card/80 backdrop-blur-md border-border/50">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 capitalize">{p.type}</Badge>
                  <CardTitle className="text-base">Q{i + 1}. {p.title || p.description}</CardTitle>
                </div>
                <Badge variant={earned === p.points ? "default" : "secondary"}>
                  {Math.round(earned)}/{p.points} pts
                </Badge>
              </CardHeader>
              <CardContent>
                {p.type === "mcq" && (
                  <div className="space-y-2">
                    {options.map((opt: any) => {
                      const isSelected = selectedIds.includes(opt.id);
                      const isCorrect = correctIds.includes(opt.id);
                      let style = "border-border/50 bg-muted/30";
                      if (isCorrect) style = "border-green-500/50 bg-green-500/10";
                      if (isSelected && !isCorrect) style = "border-destructive/50 bg-destructive/10";
                      return (
                        <div key={opt.id} className={`flex items-center gap-3 rounded-lg border p-3 ${style}`}>
                          {isSelected && isCorrect && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                          {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                          {!isSelected && isCorrect && <CheckCircle className="h-4 w-4 text-green-500/50 shrink-0" />}
                          {!isSelected && !isCorrect && <div className="h-4 w-4 shrink-0" />}
                          <span className="text-sm text-foreground">{opt.text}</span>
                        </div>
                      );
                    })}
                    {p.explanation && (
                      <p className="text-sm text-muted-foreground mt-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        {p.explanation}
                      </p>
                    )}
                  </div>
                )}

                {p.type === "written" && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Your Answer</p>
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm text-foreground">
                      {sub?.text_answer || <span className="text-muted-foreground italic">No answer submitted</span>}
                    </div>
                  </div>
                )}

                {p.type === "coding" && (
                  <div className="space-y-4">
                    {sub?.code ? (
                      <div className="rounded-lg overflow-hidden border border-border/50">
                        <Editor
                          height="200px"
                          language={sub.language || "javascript"}
                          value={sub.code}
                          theme={theme === "dark" ? "vs-dark" : "light"}
                          options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13 }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground italic">
                        No code submitted
                      </div>
                    )}
                    {sub?.test_results && sub.test_results.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Test Case</TableHead>
                            <TableHead className="w-24">Result</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sub.test_results.map((t: any, j: number) => (
                            <TableRow key={t.id || j}>
                              <TableCell className="text-foreground">Test #{j + 1}</TableCell>
                              <TableCell>
                                {t.passed ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-destructive" />}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {sub && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{sub.passed_count}/{sub.total_count} tests passed</span>
                        <span>Status: {sub.status}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button variant="ghost" onClick={() => navigate("/dashboard/results")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Results
      </Button>
    </div>
  );
}
