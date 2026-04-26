import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  ArrowLeft, ChevronRight, ChevronLeft, CheckCircle, Clock, FileText,
  MessageSquare, Save, User, Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/hooks/useClasses";
import { useExams, useExamResults } from "@/hooks/useExams";
import { useGradeSubmission } from "@/hooks/useGradeSubmission";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

type Step = "course" | "exam" | "grading";

export default function GradeWritten() {
  const { toast } = useToast();
  const { data: classes, isLoading: classesLoading, error: classesError, refetch: refetchClasses } = useClasses();
  const { data: allExams, isLoading: examsLoading } = useExams();

  const [step, setStep] = useState<Step>("course");
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [selectedExamId, setSelectedExamId] = useState<number>(0);

  const { data: examResults, isLoading: resultsLoading } = useExamResults(selectedExamId);
  const gradeSubmissionMutation = useGradeSubmission();

  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [currentSubIdx, setCurrentSubIdx] = useState(0);
  const [filter, setFilter] = useState<"all" | "pending" | "graded">("pending");
  const [typeFilter, setTypeFilter] = useState<"all" | "written" | "mcq" | "coding">("all");
  const [localGrades, setLocalGrades] = useState<Record<number, { score: number | null; feedback: string }>>({});

  const courseList = (classes || []).filter((c: any) =>
    (allExams || []).some((e: any) =>
      e.class_id === c.id ||
      (e.classes || []).some((cl: any) => cl.id === c.id) ||
      (e.exam_classes || []).some((ec: any) => ec.class_id === c.id)
    )
  );
  const examList = allExams || [];
  const examsForCourse = selectedCourseId
    ? examList.filter((e: any) => e.class_id === selectedCourseId || (e.classes || []).some((c: any) => c.id === selectedCourseId) || (e.exam_classes || []).some((ec: any) => ec.class_id === selectedCourseId))
    : [];

  // Flatten all submissions from exam results for grading
  const allStudentResults: any[] = examResults || [];

  // Get all individual submissions that are written/pending_review
  const allSubmissions = allStudentResults.flatMap((sr: any) =>
    (sr.submissions || []).map((sub: any) => ({
      ...sub,
      studentName: sr.name,
      studentEmail: sr.email,
      studentUserId: sr.user_id,
    }))
  );

  const typedSubs = typeFilter === "all" ? allSubmissions : allSubmissions.filter((s: any) => s.type === typeFilter);
  const pendingSubs = typedSubs.filter((s: any) => s.status === "pending_review");
  const gradedSubs = typedSubs.filter((s: any) => s.status !== "pending_review");
  const filteredSubs = filter === "all" ? typedSubs : filter === "pending" ? pendingSubs : gradedSubs;

  const currentSub = filteredSubs.find((s: any) => s.id === selectedStudentId) || filteredSubs[0];
  const localGrade = currentSub ? localGrades[currentSub.id] : undefined;

  // Seed local grade draft from persisted submission so teachers can see
  // and edit prior feedback/score when overriding.
  useEffect(() => {
    if (!currentSub) return;
    setLocalGrades((prev) => {
      if (prev[currentSub.id]) return prev;
      return {
        ...prev,
        [currentSub.id]: {
          score: currentSub.status !== "pending_review" ? currentSub.score ?? null : null,
          feedback: currentSub.teacher_feedback ?? "",
        },
      };
    });
  }, [currentSub?.id]);

  // Auto-select first student when entering grading
  useEffect(() => {
    if (step === "grading" && filteredSubs.length > 0 && !filteredSubs.find((s: any) => s.id === selectedStudentId)) {
      setSelectedStudentId(filteredSubs[0].id);
    }
  }, [step, filteredSubs, selectedStudentId]);

  const updateLocalGrade = (subId: number, score: number | null, feedback?: string) => {
    setLocalGrades((prev) => ({
      ...prev,
      [subId]: {
        score,
        feedback: feedback ?? prev[subId]?.feedback ?? "",
      },
    }));
  };

  const submitGrade = async () => {
    if (!currentSub) return;
    const grade = localGrades[currentSub.id];
    if (!grade || grade.score === null) {
      toast({ title: "Set a score", description: "Please assign a score before submitting.", variant: "destructive" });
      return;
    }
    try {
      await gradeSubmissionMutation.mutateAsync({
        id: currentSub.id,
        data: { score: grade.score, status: "accepted", teacher_feedback: grade.feedback ?? "" },
      });
      toast({ title: "Grade saved", description: `${currentSub.studentName}'s submission has been graded.` });
      // Move to next pending
      const nextPending = filteredSubs.find((s: any) => s.id !== currentSub.id && s.status === "pending_review");
      if (nextPending) setSelectedStudentId(nextPending.id);
    } catch (err: any) {
      toast({ title: "Grading failed", description: err.message, variant: "destructive" });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (step !== "grading" || !currentSub) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "0") updateLocalGrade(currentSub.id, 0);
      else if (e.key === "5") updateLocalGrade(currentSub.id, 50);
      else if (e.key === "f" || e.key === "F") updateLocalGrade(currentSub.id, 100);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, currentSub]);

  if (classesLoading || examsLoading) return <PageSkeleton cards={3} />;
  if (classesError) return <ErrorState message="Failed to load courses" onRetry={refetchClasses} />;

  // ---- Step: Course selection ----
  if (step === "course") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Manual Grading
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Select a course to start grading.</p>
        </div>
        {courseList.length === 0 ? (
          <EmptyState icon={FileText} title="No courses" description="Create a course first." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseList.map((c: any) => {
              const courseExamCount = examList.filter((e: any) =>
                e.class_id === c.id || (e.classes || []).some((cl: any) => cl.id === c.id) || (e.exam_classes || []).some((ec: any) => ec.class_id === c.id)
              ).length;
              return (
                <Card key={c.id} className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all" onClick={() => { setSelectedCourseId(c.id); setStep("exam"); }}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      {c.section && <p className="text-xs text-muted-foreground mt-0.5">{c.section}</p>}
                      <Badge variant="secondary" className="text-[10px] mt-2">{courseExamCount} exam(s)</Badge>
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

  // ---- Step: Exam selection ----
  if (step === "exam") {
    const selectedCourse = courseList.find((c: any) => c.id === selectedCourseId);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setStep("course"); setSelectedCourseId(0); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedCourse?.name || "Course"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Select an exam to grade</p>
          </div>
        </div>
        {examsForCourse.length === 0 ? (
          <EmptyState icon={FileText} title="No exams" description="No exams found for this course." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {examsForCourse.map((e: any) => (
              <Card key={e.id} className="bg-card/80 backdrop-blur-md border-border/50 cursor-pointer hover:border-primary/50 transition-all" onClick={() => { setSelectedExamId(e.id); setStep("grading"); }}>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {e.duration_minutes || 60} min &middot; {e.problem_count || 0} questions
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Step: Grading interface ----
  if (resultsLoading) return <PageSkeleton cards={2} rows={4} />;

  const selectedCourse = courseList.find((c: any) => c.id === selectedCourseId);
  const selectedExam = examList.find((e: any) => e.id === selectedExamId);
  const overallProgress = typedSubs.length > 0
    ? (gradedSubs.length / typedSubs.length) * 100
    : 0;

  if (filteredSubs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { setStep("exam"); setSelectedExamId(0); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Manual Grading</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as typeof typeFilter); setSelectedStudentId(0); }}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="written">Written</SelectItem>
                <SelectItem value="mcq">MCQ</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter} onValueChange={(v) => { setFilter(v as typeof filter); setSelectedStudentId(0); }}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({typedSubs.length})</SelectItem>
                <SelectItem value="pending">Pending ({pendingSubs.length})</SelectItem>
                <SelectItem value="graded">Graded ({gradedSubs.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Card className="border-border/50 bg-card/80 backdrop-blur-md">
          <CardContent className="p-12 text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-60" />
            <p className="font-medium text-foreground">
              {filter === "pending" && gradedSubs.length > 0 ? "All graded!" : "All done!"}
            </p>
            <p className="text-sm mt-1">
              No {filter === "pending" ? "pending" : filter === "graded" ? "graded" : ""} submissions.
              {filter === "pending" && gradedSubs.length > 0 && " Switch to Graded to re-grade."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setStep("exam"); setSelectedExamId(0); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Manual Grading</h1>
            <p className="text-xs text-muted-foreground">
              {selectedCourse?.name} &middot; {selectedExam?.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as typeof typeFilter); setSelectedStudentId(0); }}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="written">Written</SelectItem>
              <SelectItem value="mcq">MCQ</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={(v) => { setFilter(v as typeof filter); setSelectedStudentId(0); }}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({typedSubs.length})</SelectItem>
              <SelectItem value="pending">Pending ({pendingSubs.length})</SelectItem>
              <SelectItem value="graded">Graded ({gradedSubs.length})</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{Math.round(overallProgress)}%</span>
            <Progress value={overallProgress} className="h-1.5 w-20" />
          </div>
        </div>
      </div>

      {/* Split panel layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-xl border border-border/50 overflow-hidden bg-card/60 backdrop-blur-sm">
        {/* Left: Submission list */}
        <ResizablePanel defaultSize={25} minSize={18} maxSize={35}>
          <div className="flex flex-col h-full">
            <div className="px-3 py-2.5 border-b border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Submissions ({filteredSubs.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredSubs.map((sub: any) => {
                const isActive = sub.id === currentSub?.id;
                const isPending = sub.status === "pending_review";
                return (
                  <div
                    key={sub.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-border/30 transition-colors",
                      isActive ? "bg-primary/10" : "hover:bg-muted/40"
                    )}
                    onClick={() => setSelectedStudentId(sub.id)}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0",
                      !isPending ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"
                    )}>
                      {!isPending ? <CheckCircle className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{sub.studentName}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {sub.problem?.title || `Problem #${sub.problem_id}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Grading area */}
        <ResizablePanel defaultSize={75} minSize={50}>
          {currentSub ? (
            <div className="flex flex-col h-full">
              {/* Student info */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{currentSub.studentName}</span>
                  <span className="text-muted-foreground text-xs">({currentSub.studentEmail})</span>
                </div>
                <Badge variant={currentSub.status === "pending_review" ? "secondary" : "default"} className="text-[10px]">
                  {currentSub.status === "pending_review" ? "Pending" : "Graded"}
                </Badge>
              </div>

              {/* Grading content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Problem title */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold text-primary mb-1.5 uppercase tracking-wider">Problem</p>
                  <p className="text-sm text-foreground font-medium">
                    {currentSub.problem?.title || `Problem #${currentSub.problem_id}`}
                  </p>
                  {currentSub.problem?.body && (
                    <p className="text-sm text-muted-foreground mt-2">{currentSub.problem.body}</p>
                  )}
                  {currentSub.problem?.image_url && (
                    <img src={currentSub.problem.image_url} alt="Question" className="mt-3 max-h-64 rounded-lg border border-border/50" />
                  )}
                </div>

                {/* Student answer */}
                <div className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student's Answer</p>
                    <Badge variant="outline" className="text-[10px]">{currentSub.type || "written"}</Badge>
                  </div>
                  {currentSub.type === "mcq" ? (
                    <McqReview problem={currentSub.problem} selectedRaw={currentSub.selected_options} />
                  ) : currentSub.type === "coding" ? (
                    <CodingReview sub={currentSub} />
                  ) : currentSub.text_answer ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{currentSub.text_answer}</p>
                  ) : currentSub.code ? (
                    <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto font-mono text-foreground whitespace-pre-wrap">{currentSub.code}</pre>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No answer provided.</p>
                  )}
                </div>

                {currentSub.status !== "pending_review" && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                    Overriding previous grade. Saving will update the student's score and aggregate.
                  </div>
                )}

                {/* Points grading */}
                <div className="rounded-lg border border-border/50 bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</p>
                    <span className="text-lg font-bold text-foreground">
                      {localGrade?.score !== null && localGrade?.score !== undefined ? localGrade.score : currentSub.score ?? "—"}
                      <span className="text-sm text-muted-foreground font-normal">/100</span>
                    </span>
                  </div>

                  <Slider
                    value={[localGrade?.score ?? currentSub.score ?? 0]}
                    max={100}
                    step={1}
                    onValueChange={([val]) => updateLocalGrade(currentSub.id, val)}
                    className="w-full"
                  />

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => updateLocalGrade(currentSub.id, 0)}>
                      Zero (0)
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => updateLocalGrade(currentSub.id, 50)}>
                      Half (50)
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => updateLocalGrade(currentSub.id, 100)}>
                      Full (100)
                    </Button>
                  </div>
                </div>

                {/* Feedback */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feedback</label>
                  <Textarea
                    placeholder="Optional feedback for the student..."
                    value={localGrade?.feedback ?? ""}
                    onChange={(e) => updateLocalGrade(currentSub.id, localGrade?.score ?? null, e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Bottom actions bar */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-card/80">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Keyboard className="h-3 w-3" />
                  <span>0 Zero</span>
                  <span>&middot;</span>
                  <span>5 Half</span>
                  <span>&middot;</span>
                  <span>F Full</span>
                </div>
                <Button
                  className="gap-2"
                  size="sm"
                  onClick={submitGrade}
                  disabled={gradeSubmissionMutation.isPending}
                >
                  <Save className="h-3.5 w-3.5" />
                  {gradeSubmissionMutation.isPending ? "Saving..." : currentSub.status !== "pending_review" ? "Update Grade" : "Submit Grade"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Select a submission to start grading
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function parseJSON<T>(raw: any, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw !== "string") return raw as T;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function McqReview({ problem, selectedRaw }: { problem: any; selectedRaw: any }) {
  const options = parseJSON<any[]>(problem?.options, []);
  const selected = parseJSON<any[]>(selectedRaw, []);
  const selectedSet = new Set((Array.isArray(selected) ? selected : []).map((x: any) => String(x)));

  if (!options.length) {
    return <p className="text-sm text-muted-foreground italic">No options available.</p>;
  }

  return (
    <div className="space-y-2">
      {options.map((opt: any, i: number) => {
        const id = String(opt.id ?? i);
        const text = opt.text ?? opt.label ?? String(opt);
        const isCorrect = !!opt.is_correct || !!opt.correct;
        const picked = selectedSet.has(id) || selectedSet.has(String(i));
        return (
          <div
            key={id}
            className={cn(
              "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
              picked && isCorrect && "border-green-500/50 bg-green-500/10",
              picked && !isCorrect && "border-red-500/50 bg-red-500/10",
              !picked && isCorrect && "border-green-500/30 bg-green-500/5",
              !picked && !isCorrect && "border-border/50 bg-muted/20"
            )}
          >
            <div className={cn(
              "mt-0.5 h-4 w-4 rounded-full border shrink-0",
              picked ? "bg-primary border-primary" : "border-muted-foreground/40"
            )} />
            <span className="flex-1 text-foreground">{text}</span>
            {isCorrect && <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-600">correct</Badge>}
            {picked && <Badge variant="outline" className="text-[10px]">student</Badge>}
          </div>
        );
      })}
    </div>
  );
}

function CodingReview({ sub }: { sub: any }) {
  const results: any[] = sub.test_results || [];
  return (
    <div className="space-y-3">
      {sub.code ? (
        <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto font-mono text-foreground whitespace-pre-wrap">{sub.code}</pre>
      ) : (
        <p className="text-sm text-muted-foreground italic">No code submitted.</p>
      )}
      {results.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Test Cases ({results.filter((r) => r.passed).length}/{results.length} passed)</p>
          {results.map((r: any, i: number) => (
            <div
              key={r.id ?? i}
              className={cn(
                "rounded-md border px-3 py-2 text-xs space-y-1",
                r.passed ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Test {i + 1}</span>
                <Badge variant="outline" className={cn("text-[10px]", r.passed ? "text-green-600 border-green-500/50" : "text-red-600 border-red-500/50")}>
                  {r.passed ? "passed" : r.status || "failed"}
                </Badge>
              </div>
              {r.test_case?.input !== undefined && (
                <div><span className="text-muted-foreground">input:</span> <code className="font-mono">{r.test_case.input}</code></div>
              )}
              {r.test_case?.expected_output !== undefined && (
                <div><span className="text-muted-foreground">expected:</span> <code className="font-mono">{r.test_case.expected_output}</code></div>
              )}
              {r.actual_output !== undefined && (
                <div><span className="text-muted-foreground">got:</span> <code className="font-mono">{r.actual_output}</code></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
