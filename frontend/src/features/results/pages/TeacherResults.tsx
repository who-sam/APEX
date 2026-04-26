import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, Download, BarChart3, CheckCircle, XCircle, FileText, Eye, ArrowLeft, ChevronRight, Check, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/hooks/useClasses";
import { useExams, useExamResults } from "@/hooks/useExams";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

function computeChartData(results: any[]) {
  // Build per-problem stats from all students' submissions
  const problemMap = new Map<number, { title: string; type: string; scores: number[]; index: number }>();
  const tcPassMap = new Map<number, { passed: number; total: number }>();
  let problemIdx = 0;

  for (const student of results) {
    for (const sub of student.submissions || []) {
      const pid = sub.problem_id;
      if (!problemMap.has(pid)) {
        problemMap.set(pid, {
          title: sub.problem?.title || `Problem ${pid}`,
          type: sub.type || sub.problem?.type || "coding",
          scores: [],
          index: problemIdx++,
        });
      }
      problemMap.get(pid)!.scores.push(sub.score || 0);

      // Aggregate test case results for coding questions
      if ((sub.type === "coding" || sub.problem?.type === "coding") && sub.test_results) {
        for (let j = 0; j < sub.test_results.length; j++) {
          const tr = sub.test_results[j];
          if (!tcPassMap.has(j)) tcPassMap.set(j, { passed: 0, total: 0 });
          const entry = tcPassMap.get(j)!;
          entry.total++;
          if (tr.passed) entry.passed++;
        }
      }
    }
  }

  const questionPerformance = Array.from(problemMap.entries())
    .sort((a, b) => a[1].index - b[1].index)
    .map(([, p], i) => ({
      name: `Q${i + 1} (${p.type.charAt(0).toUpperCase() + p.type.slice(1)})`,
      avgScore: p.scores.length > 0 ? Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length) : 0,
    }));

  const testCaseResults = Array.from(tcPassMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([idx, tc]) => ({
      name: `TC ${idx + 1}`,
      passRate: tc.total > 0 ? Math.round((tc.passed / tc.total) * 100) : 0,
    }));

  return { questionPerformance, testCaseResults };
}

export default function TeacherResults() {
  const { toast } = useToast();
  const location = useLocation();
  const routeState = location.state as { courseId?: number; examId?: number } | null;

  const { data: classes, isLoading: classesLoading, error: classesError, refetch: refetchClasses } = useClasses();
  const { data: allExams, isLoading: examsLoading } = useExams();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(routeState?.courseId || null);
  const [selectedExamId, setSelectedExamId] = useState<number>(routeState?.examId || 0);
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);

  // Auto-select first exam when navigating with route state
  useEffect(() => {
    if (routeState?.courseId && selectedClassId === routeState.courseId && !selectedExamId) {
      const examList = allExams || [];
      const examsForCourse = examList.filter((e: any) => e.class_id === routeState.courseId || (e.classes || []).some((c: any) => c.id === routeState.courseId));
      if (examsForCourse.length > 0) {
        setSelectedExamId(examsForCourse[0].id);
      }
    }
  }, [routeState, selectedClassId, selectedExamId, allExams]);

  const { data: examResults, isLoading: resultsLoading } = useExamResults(selectedExamId);

  if (classesLoading || examsLoading) return <PageSkeleton cards={3} rows={4} />;
  if (classesError) return <ErrorState message="Failed to load courses" onRetry={refetchClasses} />;

  const courseList = classes || [];
  const examList = allExams || [];

  // Filter exams by selected class
  const examsForClass = selectedClassId
    ? examList.filter((e: any) => e.class_id === selectedClassId || (e.classes || []).some((c: any) => c.id === selectedClassId) || (e.exam_classes || []).some((ec: any) => ec.class_id === selectedClassId))
    : [];

  const selectedExam = examList.find((e: any) => e.id === selectedExamId);
  const results: any[] = examResults || [];
  const { questionPerformance, testCaseResults } = computeChartData(results);

  const passed = results.filter((s: any) => s.avg_score >= 60).length;
  const failed = results.filter((s: any) => s.avg_score < 60).length;
  const classAvg = results.length > 0
    ? Math.round(results.reduce((a: number, s: any) => a + (s.avg_score || 0), 0) / results.length * 100) / 100
    : 0;

  const handleExport = () => {
    if (!selectedExam || results.length === 0) return;
    const headers = "Student ID,Name,Email,Avg Score,Total Score,Submissions\n";
    const rows = results.map((s: any) =>
      `${s.user_id},${s.name},${s.email},${s.avg_score?.toFixed(1)},${s.total_score?.toFixed(1)},${s.submissions?.length || 0}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(selectedExam.title || "exam").replace(/\s+/g, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Results downloaded as CSV." });
  };

  // ── No course selected yet ──
  if (!selectedClassId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Select a course to view exam results</p>
        </div>
        {courseList.length === 0 ? (
          <EmptyState icon={BarChart3} title="No courses" description="Create a course first to see results." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseList.map((c: any) => {
              const examCount = examList.filter((e: any) => e.class_id === c.id || (e.classes || []).some((cl: any) => cl.id === c.id) || (e.exam_classes || []).some((ec: any) => ec.class_id === c.id)).length;
              return (
                <Card
                  key={c.id}
                  className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => setSelectedClassId(c.id)}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      {c.section && <p className="text-xs text-muted-foreground font-mono mt-1">{c.section}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {examCount} exam(s)
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Course selected but no exam ──
  if (!selectedExamId) {
    const selectedClass = courseList.find((c: any) => c.id === selectedClassId);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedClassId(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedClass?.name || "Course"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Select an exam to view results</p>
          </div>
        </div>
        {examsForClass.length === 0 ? (
          <EmptyState icon={BarChart3} title="No exams" description="No exams found for this course." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {examsForClass.map((e: any) => (
              <Card
                key={e.id}
                className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => setSelectedExamId(e.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{e.title || e.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {e.start_time ? new Date(e.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{e.duration_minutes || 60} min</span>
                    <span>{e.problem_count || 0} questions</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Exam selected: full analytics ──
  if (resultsLoading) return <PageSkeleton cards={4} rows={6} />;

  const selectedClass = courseList.find((c: any) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedExamId(0)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedExam?.title || selectedExam?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {selectedClass?.name} {selectedExam?.start_time ? `\u2022 ${new Date(selectedExam.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={results.length === 0}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Submissions</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{results.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Class Average</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{classAvg}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs">Passed</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{passed}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs">Failed</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Question Performance (Class Avg %)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionPerformance} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Programming — Test Case Pass Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testCaseResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No coding submissions yet</p>
            ) : (
              <div className="space-y-3">
                {testCaseResults.map((tc) => (
                  <div key={tc.name} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-12">{tc.name}</span>
                    <Progress value={tc.passRate} className="h-3 flex-1" />
                    <span className={`text-sm font-medium w-12 text-right ${tc.passRate >= 70 ? "text-green-500" : "text-destructive"}`}>
                      {tc.passRate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student results table */}
      {results.length === 0 ? (
        <EmptyState icon={Users} title="No submissions" description="No students have submitted answers for this exam yet." />
      ) : (
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Student Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((s: any) => {
                  const score = s.avg_score != null ? Math.round(s.avg_score * 100) / 100 : 0;
                  const status = score >= 60 ? "passed" : "failed";
                  const secs = s.duration_seconds ?? (s.duration_minutes ? s.duration_minutes * 60 : 0);
                  const time = secs > 0
                    ? secs >= 60
                      ? `${Math.floor(secs / 60)} min ${secs % 60}s`
                      : `${secs}s`
                    : "—";
                  return (
                    <TableRow key={s.user_id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{s.user_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{score}%</span>
                          <Progress value={score} className="h-1.5 w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status === "passed" ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
                          {status === "passed" ? "Passed" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{time}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setViewingStudent(s)}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Individual student answer dialog */}
      <Dialog open={!!viewingStudent} onOpenChange={(open) => { if (!open) setViewingStudent(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingStudent?.name}'s Answers</span>
              <Badge variant={viewingStudent?.avg_score >= 60 ? "default" : "destructive"} className="ml-2">
                {(Math.round((viewingStudent?.avg_score || 0) * 100) / 100).toFixed(2)}%
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {(viewingStudent?.submissions || []).map((sub: any, i: number) => (
              <Card key={sub.id || i} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{sub.type || sub.problem?.type || "—"}</Badge>
                      <span className="text-sm font-medium text-foreground">Q{i + 1}: {sub.problem?.title || sub.question || `Problem #${sub.problem_id}`}</span>
                    </div>
                    {(() => {
                      const maxPts = sub.problem?.points || sub.max_score || sub.maxPoints || 10;
                      const earnedPts = Math.round((sub.score || 0) / 100 * maxPts * 10) / 10;
                      return (
                        <span className={`text-sm font-bold ${sub.score >= 80 ? "text-green-500" : sub.score < 50 ? "text-destructive" : "text-foreground"}`}>
                          {sub.status === "pending_review" ? "Pending" : `${earnedPts}/${maxPts}`}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Student's Answer</p>
                      {(sub.type === "coding" || sub.type === "Coding" || sub.language) ? (
                        <div className="space-y-3">
                          <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto font-mono text-foreground">{sub.code || sub.text_answer || "—"}</pre>
                          {sub.test_results && sub.test_results.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Test Cases</p>
                              {sub.test_results.map((t: any, j: number) => (
                                <div
                                  key={t.id || j}
                                  className={`rounded-md border p-2.5 space-y-1.5 ${t.passed ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                                      {t.passed ? <Check className="h-3.5 w-3.5 text-green-500" /> : <X className="h-3.5 w-3.5 text-destructive" />}
                                      Test #{j + 1}
                                    </span>
                                    <span className={`text-[10px] font-medium ${t.passed ? "text-green-500" : "text-destructive"}`}>
                                      {t.passed ? "Passed" : "Failed"}
                                    </span>
                                  </div>
                                  {t.test_case?.input && (
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Input</p>
                                      <pre className="text-[11px] bg-muted/50 rounded p-1.5 font-mono text-foreground overflow-x-auto">{t.test_case.input}</pre>
                                    </div>
                                  )}
                                  {t.test_case?.expected_output && (
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected</p>
                                      <pre className="text-[11px] bg-muted/50 rounded p-1.5 font-mono text-foreground overflow-x-auto">{t.test_case.expected_output}</pre>
                                    </div>
                                  )}
                                  {t.actual_output && (
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Actual</p>
                                      <pre className={`text-[11px] rounded p-1.5 font-mono overflow-x-auto ${t.passed ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>{t.actual_output}</pre>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : sub.type === "mcq" ? (() => {
                        const options: {id: string; text: string}[] = (() => { try { return typeof sub.problem?.options === "string" ? JSON.parse(sub.problem.options) : (sub.problem?.options || []); } catch { return []; } })();
                        const selectedIds: string[] = (() => { try { return typeof sub.selected_options === "string" ? JSON.parse(sub.selected_options) : (sub.selected_options || []); } catch { return []; } })();
                        const correctIds: string[] = (() => { try { return typeof sub.problem?.correct_option_ids === "string" ? JSON.parse(sub.problem.correct_option_ids) : (sub.problem?.correct_option_ids || []); } catch { return []; } })();
                        return (
                          <div className="space-y-1.5">
                            {options.map((opt) => {
                              const isSelected = selectedIds.includes(opt.id);
                              const isCorrect = correctIds.includes(opt.id);
                              let style = "border-border/50 bg-muted/30 text-muted-foreground";
                              if (isCorrect) style = "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400";
                              if (isSelected && !isCorrect) style = "border-destructive/50 bg-destructive/10 text-foreground";
                              return (
                                <div key={opt.id} className={`flex items-center gap-2 rounded-md border p-2 text-sm ${style}`}>
                                  {isSelected && isCorrect && <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                                  {isSelected && !isCorrect && <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                                  {!isSelected && isCorrect && <CheckCircle className="h-3.5 w-3.5 text-green-500/50 shrink-0" />}
                                  {!isSelected && !isCorrect && <div className="h-3.5 w-3.5 shrink-0" />}
                                  <span>{typeof opt === "string" ? opt : (opt.text ?? "")}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })() : (
                        <p className={`text-sm rounded-md p-2 ${sub.status === "pending_review" ? "bg-accent/10 text-accent" : sub.status === "accepted" || sub.is_correct ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-foreground"}`}>
                          {sub.text_answer || "—"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!viewingStudent?.submissions || viewingStudent.submissions.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No submission details available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
