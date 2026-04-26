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
  const gradesAnnounced: boolean = data?.grades_announced ?? true;

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

  // sub.score is 0-100 percentage; convert to earned points using problem's max points
  const earnedTotal = submissions.reduce((s: number, sub: any) => {
    const prob = problems.find((p: any) => p.id === sub.problem_id);
    const maxPts = prob?.points || 0;
    return s + (sub.score || 0) / 100 * maxPts;
  }, 0);
  const percentage = totalPoints > 0 ? Math.round((earnedTotal / totalPoints) * 10000) / 100 : 0;
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
                {gradesAnnounced ? (
                  <Badge variant={passed ? "default" : "destructive"}>{passed ? "Passed" : "Failed"}</Badge>
                ) : (
                  <Badge variant="outline">Submitted</Badge>
                )}
                <span className="text-sm text-muted-foreground">{submissions.length} submissions</span>
              </div>
            </div>
            {gradesAnnounced && (
              <div className="text-right">
                <p className="text-4xl font-bold text-primary">{Math.round(earnedTotal * 10) / 10}/{totalPoints}</p>
                <p className="text-sm text-muted-foreground">{percentage}%</p>
              </div>
            )}
          </div>
          {gradesAnnounced && (
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your score</span>
                <span className="text-muted-foreground">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-3" />
            </div>
          )}
          {!gradesAnnounced && (
            <p className="mt-4 text-sm text-muted-foreground">Grades have not been released yet. You can review your submitted answers below.</p>
          )}
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {problems.map((p: any, i: number) => {
          const sub = subMap.get(p.id);
          const earnedPct = sub?.score ?? 0;
          const earned = (earnedPct / 100) * (p.points || 0);
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
                {gradesAnnounced && (
                  <Badge variant={sub?.status === "pending_review" ? "outline" : earned >= p.points ? "default" : "secondary"}>
                    {sub?.status === "pending_review" ? "Pending Review" : `${Math.round(earned * 10) / 10}/${p.points} pts`}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {p.image_url && (
                  <img src={p.image_url} alt="Question" className="max-h-80 rounded-lg border border-border/50" />
                )}
                {p.type === "mcq" && (
                  <div className="space-y-2">
                    {options.map((opt: any) => {
                      const isSelected = selectedIds.includes(opt.id);
                      const isCorrect = correctIds.includes(opt.id);
                      let style = "border-border/50 bg-muted/30";
                      if (gradesAnnounced) {
                        if (isCorrect) style = "border-green-500/50 bg-green-500/10";
                        if (isSelected && !isCorrect) style = "border-destructive/50 bg-destructive/10";
                      } else if (isSelected) {
                        style = "border-primary/50 bg-primary/10";
                      }
                      return (
                        <div key={opt.id} className={`flex items-center gap-3 rounded-lg border p-3 ${style}`}>
                          {gradesAnnounced ? (
                            <>
                              {isSelected && isCorrect && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                              {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                              {!isSelected && isCorrect && <CheckCircle className="h-4 w-4 text-green-500/50 shrink-0" />}
                              {!isSelected && !isCorrect && <div className="h-4 w-4 shrink-0" />}
                            </>
                          ) : (
                            <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}`} />
                          )}
                          <span className="text-sm text-foreground">{typeof opt === "string" ? opt : String(opt.text ?? "")}</span>
                        </div>
                      );
                    })}
                    {gradesAnnounced && p.explanation && (
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
                    {gradesAnnounced && sub?.teacher_feedback && (
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                        <p className="text-xs font-semibold text-primary">💬 Teacher Feedback</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{sub.teacher_feedback}</p>
                      </div>
                    )}
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
                    {gradesAnnounced && sub?.test_results && sub.test_results.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Test Cases</p>
                        {sub.test_results.map((t: any, j: number) => (
                          <div
                            key={t.id || j}
                            className={`rounded-lg border p-3 space-y-2 ${t.passed ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                                {t.passed ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-destructive" />}
                                Test #{j + 1}
                              </span>
                              <span className={`text-xs font-medium ${t.passed ? "text-green-500" : "text-destructive"}`}>
                                {t.passed ? "Passed" : "Failed"}
                              </span>
                            </div>
                            {t.test_case?.input && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Input</p>
                                <pre className="text-xs bg-muted/50 rounded p-2 font-mono text-foreground overflow-x-auto">{t.test_case.input}</pre>
                              </div>
                            )}
                            {t.test_case?.expected_output && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Expected Output</p>
                                <pre className="text-xs bg-muted/50 rounded p-2 font-mono text-foreground overflow-x-auto">{t.test_case.expected_output}</pre>
                              </div>
                            )}
                            {t.actual_output && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Your Output</p>
                                <pre className={`text-xs rounded p-2 font-mono overflow-x-auto ${t.passed ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>{t.actual_output}</pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {gradesAnnounced && sub && (
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
