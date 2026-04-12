import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Play, Send, Clock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { getStudentExam, runSolution, submitSolution } from "@/lib/api";
import type { ExamData, ProblemData, RunResult } from "@/lib/api";

const LANG_MAP: Record<string, number> = {
  python3: 100,
  javascript: 102,
  c: 103,
  cpp: 105,
};

export default function ExamTaking() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [language, setLanguage] = useState("python3");
  const [codeMap, setCodeMap] = useState<Record<number, string>>({});
  const [runResults, setRunResults] = useState<RunResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [submittedProblems, setSubmittedProblems] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;
    getStudentExam(Number(examId))
      .then((data) => {
        setExam(data.exam);
        const probs = data.exam.problems || [];
        setProblems(probs);
        const initialCode: Record<number, string> = {};
        probs.forEach((p) => {
          initialCode[p.id] = p.starter_code || "# Write your solution here\n";
        });

        // Pre-populate submitted problems from previous submissions
        const submitted = new Set<number>();
        const codeFromSubmissions: Record<number, string> = {};
        if (data.submissions && data.submissions.length > 0) {
          for (const sub of data.submissions) {
            submitted.add(sub.problem_id);
            codeFromSubmissions[sub.problem_id] = sub.code;
          }
        }
        setSubmittedProblems(submitted);
        // Override starter code with previously submitted code
        probs.forEach((p) => {
          if (codeFromSubmissions[p.id]) {
            initialCode[p.id] = codeFromSubmissions[p.id];
          }
        });

        setCodeMap(initialCode);

        // Calculate remaining time based on start_time + duration
        if (data.exam.duration_minutes) {
          if (data.exam.start_time) {
            const startMs = new Date(data.exam.start_time).getTime();
            const endMs = startMs + data.exam.duration_minutes * 60 * 1000;
            const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
            setTimeLeft(remaining);
          } else {
            setTimeLeft(data.exam.duration_minutes * 60);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [examId]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const currentProblem = problems[currentProblemIdx];
  const currentCode = currentProblem ? codeMap[currentProblem.id] || "" : "";

  const setCurrentCode = (code: string) => {
    if (!currentProblem) return;
    setCodeMap((prev) => ({ ...prev, [currentProblem.id]: code }));
  };

  const handleRun = useCallback(async () => {
    if (!currentProblem) return;
    setIsRunning(true);
    setRunResults(null);
    try {
      const res = await runSolution({
        problem_id: currentProblem.id,
        language,
        code: currentCode,
      });
      setRunResults(res.results);
    } catch (err) {
      setRunResults([]);
    } finally {
      setIsRunning(false);
    }
  }, [currentProblem, language, currentCode]);

  const handleSubmit = useCallback(async () => {
    if (!currentProblem || !exam) return;
    setIsRunning(true);
    try {
      await submitSolution({
        problem_id: currentProblem.id,
        exam_id: exam.id,
        language,
        code: currentCode,
      });
      setSubmittedProblems((prev) => new Set(prev).add(currentProblem.id));
    } catch (err) {}
    setIsRunning(false);
  }, [currentProblem, exam, language, currentCode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!exam || problems.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Exam not found</h1>
        <Button variant="outline" onClick={() => navigate("/dashboard/upcoming")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Exams
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/upcoming")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-bold text-foreground">{exam.title}</h2>
          {timeLeft !== null && (
            <Badge variant="outline" className={`gap-1 ${timeLeft < 300 ? "border-destructive text-destructive" : ""}`}>
              <Clock className="h-3 w-3" />
              {formatTime(timeLeft)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Problem tabs */}
          {problems.map((p, i) => (
            <Button
              key={p.id}
              size="sm"
              variant={i === currentProblemIdx ? "default" : "outline"}
              className={`rounded-full w-8 h-8 p-0 ${submittedProblems.has(p.id) ? "ring-2 ring-green-500" : ""}`}
              onClick={() => { setCurrentProblemIdx(i); setRunResults(null); }}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      </div>

      {/* Main split */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-2xl border border-border overflow-hidden bg-card/60 backdrop-blur-sm">
        {/* Left panel — Problem description */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="flex h-full flex-col overflow-y-auto p-5 space-y-5">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-foreground">
                {currentProblemIdx + 1}. {currentProblem.title}
              </h3>
              <Badge variant="secondary">{currentProblem.difficulty}</Badge>
              {submittedProblems.has(currentProblem.id) && (
                <Badge className="bg-green-500/15 text-green-400 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Submitted
                </Badge>
              )}
            </div>

            <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed">
              <p className="whitespace-pre-line">{currentProblem.description}</p>
            </div>

            {currentProblem.hints && (
              <div className="rounded-xl bg-muted/50 border border-border p-4 text-sm">
                <p className="font-semibold text-foreground mb-1">Hints</p>
                <p className="text-muted-foreground">{currentProblem.hints}</p>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel — Editor + Console */}
        <ResizablePanel defaultSize={60} minSize={35}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={65} minSize={30}>
              <div className="flex h-full flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-[160px] h-8 rounded-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="python3">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="c">C</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={handleRun} disabled={isRunning}>
                      <Play className="h-4 w-4" /> Run
                    </Button>
                    <Button size="sm" className="gap-2 rounded-full" onClick={handleSubmit} disabled={isRunning}>
                      <Send className="h-4 w-4" /> Submit
                    </Button>
                  </div>
                </div>
                {/* Monaco */}
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={language === "python3" ? "python" : language === "cpp" ? "cpp" : language}
                    value={currentCode}
                    onChange={(v) => setCurrentCode(v || "")}
                    theme="vs-dark"
                    options={{
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: false },
                      padding: { top: 16 },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      lineNumbers: "on",
                      tabSize: 4,
                    }}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Bottom — Results */}
            <ResizablePanel defaultSize={35} minSize={15}>
              <div className="flex flex-col h-full overflow-y-auto p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Test Results</h4>
                {isRunning ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Running tests...
                  </div>
                ) : runResults ? (
                  <div className="space-y-3">
                    {runResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No sample test cases available for this problem. Submit your code to see grading results.
                      </p>
                    ) : (
                      <>
                        <Badge className={`rounded-full ${
                          runResults.every((r) => r.passed)
                            ? "bg-green-500/15 text-green-400 border-green-500/30"
                            : "bg-red-500/15 text-red-400 border-red-500/30"
                        }`}>
                          {runResults.every((r) => r.passed) ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> All Passed</>
                          ) : (
                            <><XCircle className="h-3.5 w-3.5 mr-1" /> Some Failed</>
                          )}
                        </Badge>
                    {runResults.map((r, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border p-3 font-mono text-xs space-y-1 ${
                          r.passed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                        }`}
                      >
                        <div className="font-semibold text-foreground">Case {i + 1}</div>
                        <div><span className="text-muted-foreground">Input: </span>{r.input}</div>
                        <div><span className="text-muted-foreground">Expected: </span>{r.expected_output}</div>
                        <div>
                          <span className="text-muted-foreground">Output: </span>
                          <span className={r.passed ? "text-green-400" : "text-red-400"}>{r.actual_output}</span>
                        </div>
                      </div>
                    ))}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Run your code to see test results.</p>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
