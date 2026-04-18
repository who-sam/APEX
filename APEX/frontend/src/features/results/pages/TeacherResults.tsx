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
  Users, Download, BarChart3, CheckCircle, XCircle, FileText, Eye, ArrowLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/hooks/useClasses";
import { useExams, useExamResults } from "@/hooks/useExams";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

// Mock data for charts (matches blueprint pattern — real API may not provide per-question analytics yet)
const questionPerformance = [
  { name: "Q1 (Written)", avgScore: 68 },
  { name: "Q2 (MCQ)", avgScore: 85 },
  { name: "Q3 (Code)", avgScore: 61 },
  { name: "Q4 (MCQ)", avgScore: 90 },
  { name: "Q5 (Written)", avgScore: 72 },
  { name: "Q6 (Code)", avgScore: 55 },
];

const testCaseResults = [
  { name: "TC 1", passRate: 95 },
  { name: "TC 2", passRate: 82 },
  { name: "TC 3", passRate: 68 },
  { name: "TC 4", passRate: 45 },
  { name: "TC 5", passRate: 38 },
];

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

  const passed = results.filter((s: any) => s.avg_score >= 60).length;
  const failed = results.filter((s: any) => s.avg_score < 60).length;
  const classAvg = results.length > 0
    ? Math.round(results.reduce((a: number, s: any) => a + (s.avg_score || 0), 0) / results.length)
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
                <BarChart data={questionPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                  const score = s.avg_score != null ? Math.round(s.avg_score) : 0;
                  const status = score >= 60 ? "passed" : "failed";
                  const time = s.duration_minutes ? `${s.duration_minutes} min` : "—";
                  return (
                    <TableRow key={s.user_id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{s.user_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{score}/{s.total_score ? Math.round(s.total_score) : 100}</span>
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
                {viewingStudent?.avg_score?.toFixed(0) || 0}/{viewingStudent?.total_score ? Math.round(viewingStudent.total_score) : 100}
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
                    <span className={`text-sm font-bold ${sub.score >= 80 ? "text-green-500" : sub.score < 50 ? "text-destructive" : "text-foreground"}`}>
                      {sub.score?.toFixed(0) || 0}/{sub.max_score || sub.maxPoints || 100}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Student's Answer</p>
                      {(sub.type === "Coding" || sub.language) ? (
                        <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto font-mono text-foreground">{sub.code || sub.text_answer || sub.studentAnswer || "—"}</pre>
                      ) : (
                        <p className={`text-sm rounded-md p-2 ${sub.status === "accepted" || sub.is_correct ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-foreground"}`}>
                          {sub.text_answer || sub.studentAnswer || sub.selected_option || "—"}
                        </p>
                      )}
                    </div>

                    {sub.correct_answer && sub.type !== "Coding" && !sub.language && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Correct Answer</p>
                        <p className="text-sm bg-green-500/10 rounded-md p-2 text-green-700 dark:text-green-400">{sub.correct_answer}</p>
                      </div>
                    )}
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
