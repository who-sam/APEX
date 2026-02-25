import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  getStudentExam,
  runSolution,
  submitSolution,
  type ExamData,
  type ProblemData,
  type SubmissionData,
  type RunResult,
} from "../api";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Send,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const LANGUAGES = [
  { label: "Python 3", value: "python3", monacoId: "python" },
  { label: "JavaScript", value: "javascript", monacoId: "javascript" },
  { label: "C", value: "c", monacoId: "c" },
  { label: "C++", value: "cpp", monacoId: "cpp" },
];

const DEFAULT_CODE: Record<string, string> = {
  python3: "# Write your solution here\n",
  javascript: "// Write your solution here\n",
  c: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
};

export default function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [language, setLanguage] = useState(LANGUAGES[0].value);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [runResults, setRunResults] = useState<RunResult[]>([]);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (!id) return;
    getStudentExam(Number(id)).then((data) => {
      setExam(data.exam);
      setProblems(data.exam.problems ?? []);
      setSubmissions(data.submissions);

      // Initialize code from starter code or default
      const initialCode: Record<string, string> = {};
      data.exam.problems?.forEach((p) => {
        let starter = DEFAULT_CODE[LANGUAGES[0].value];
        if (p.starter_code) {
          try {
            const parsed = JSON.parse(p.starter_code);
            if (parsed[LANGUAGES[0].value]) {
              starter = parsed[LANGUAGES[0].value];
            }
          } catch {
            // not JSON, use as-is
          }
        }
        initialCode[`${p.id}-${LANGUAGES[0].value}`] = starter;
      });
      setCodeMap(initialCode);

      // Set up timer
      if (data.exam.end_time) {
        const endMs = new Date(data.exam.end_time).getTime();
        const now = Date.now();
        if (endMs > now) {
          setTimeLeft(Math.floor((endMs - now) / 1000));
        } else {
          setTimeLeft(0);
        }
      }
    });
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft !== null]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && exam) {
      handleAutoSubmitAll();
    }
  }, [timeLeft]);

  const currentProblem = problems[currentProblemIndex];
  const codeKey = currentProblem
    ? `${currentProblem.id}-${language}`
    : "";
  const currentCode = codeMap[codeKey] ?? DEFAULT_CODE[language];

  const monacoLang =
    LANGUAGES.find((l) => l.value === language)?.monacoId ?? "plaintext";

  function setCode(value: string) {
    setCodeMap((prev) => ({ ...prev, [codeKey]: value }));
  }

  function handleLanguageChange(lang: string) {
    setLanguage(lang);
    const key = `${currentProblem?.id}-${lang}`;
    if (!codeMap[key]) {
      let starter = DEFAULT_CODE[lang];
      if (currentProblem?.starter_code) {
        try {
          const parsed = JSON.parse(currentProblem.starter_code);
          if (parsed[lang]) starter = parsed[lang];
        } catch {
          // ignore
        }
      }
      setCodeMap((prev) => ({ ...prev, [key]: starter }));
    }
  }

  async function handleRun() {
    if (!currentProblem) return;
    setRunning(true);
    setShowResults(true);
    setRunResults([]);
    try {
      const result = await runSolution({
        problem_id: currentProblem.id,
        language,
        code: currentCode,
      });
      setRunResults(result.results);
    } catch (err) {
      setRunResults([]);
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
    if (!currentProblem || !exam) return;
    setSubmitting(true);
    try {
      const sub = await submitSolution({
        problem_id: currentProblem.id,
        exam_id: exam.id,
        language,
        code: currentCode,
      });
      setSubmissions((prev) => [...prev, sub]);
    } finally {
      setSubmitting(false);
    }
  }

  const handleAutoSubmitAll = useCallback(async () => {
    if (!exam) return;
    for (const problem of problems) {
      const key = `${problem.id}-${language}`;
      const code = codeMap[key];
      if (code && !submissions.find((s) => s.problem_id === problem.id)) {
        try {
          await submitSolution({
            problem_id: problem.id,
            exam_id: exam.id,
            language,
            code,
          });
        } catch {
          // ignore errors during auto-submit
        }
      }
    }
  }, [exam, problems, language, codeMap, submissions]);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function isProblemSubmitted(problemId: number): boolean {
    return submissions.some((s) => s.problem_id === problemId);
  }

  if (!exam || problems.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">
        Loading exam...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">
                &lt;/&gt;
              </span>
            </div>
            <span className="text-sm font-bold text-foreground">
              {exam.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-secondary text-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none border border-border"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80 disabled:opacity-50 border border-border"
          >
            <Play size={14} />
            {running ? "Running..." : "Run"}
          </button>

          <button
            onClick={handleSubmit}
            disabled={
              submitting ||
              !currentProblem ||
              isProblemSubmitted(currentProblem.id)
            }
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send size={14} />
            {isProblemSubmitted(currentProblem?.id)
              ? "Submitted"
              : submitting
                ? "Submitting..."
                : "Submit"}
          </button>

          {timeLeft !== null && (
            <div
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-bold ${
                timeLeft < 300
                  ? "bg-destructive/15 text-destructive"
                  : "bg-secondary text-foreground"
              }`}
            >
              <Clock size={14} />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </header>

      {/* Main content: split panes */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Problem Description */}
        <div className="w-1/2 border-r border-border overflow-auto p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
              {currentProblemIndex + 1}
            </span>
            <h2 className="text-lg font-bold text-foreground">
              {currentProblem.title}
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                currentProblem.difficulty === "easy"
                  ? "bg-success/15 text-success"
                  : currentProblem.difficulty === "hard"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-primary/15 text-primary"
              }`}
            >
              {currentProblem.difficulty}
            </span>
          </div>

          <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {currentProblem.description}
          </div>

          {/* Sample test cases */}
          {currentProblem.test_cases &&
            currentProblem.test_cases.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-semibold text-foreground">
                  Examples
                </h4>
                {currentProblem.test_cases.map((tc, i) => (
                  <div
                    key={tc.id}
                    className="rounded-lg border border-border bg-secondary/50 p-3"
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Example {i + 1}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Input</p>
                        <pre className="mt-1 rounded-md bg-card p-2 text-xs font-mono text-foreground">
                          {tc.input || "(empty)"}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Output</p>
                        <pre className="mt-1 rounded-md bg-card p-2 text-xs font-mono text-foreground">
                          {tc.expected_output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* Hints */}
          {currentProblem.hints && (
            <details className="mt-4">
              <summary className="text-sm font-medium text-primary cursor-pointer hover:underline">
                Show Hints
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentProblem.hints}
              </p>
            </details>
          )}
        </div>

        {/* Right: Editor + Results */}
        <div className="w-1/2 flex flex-col min-h-0">
          {/* Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              theme="vs-dark"
              language={monacoLang}
              value={currentCode}
              onChange={(v) => setCode(v ?? "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Results panel */}
          {showResults && (
            <div className="h-48 border-t border-border overflow-auto bg-card">
              <div className="px-4 py-2 text-xs text-muted-foreground bg-secondary/50 border-b border-border flex items-center justify-between">
                <span>Test Results</span>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <div className="p-3 space-y-2">
                {running ? (
                  <p className="text-sm text-muted-foreground">
                    Running tests...
                  </p>
                ) : runResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No results yet.
                  </p>
                ) : (
                  runResults.map((r, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 ${
                        r.passed
                          ? "border-success/30 bg-success/5"
                          : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {r.passed ? (
                          <CheckCircle2 size={14} className="text-success" />
                        ) : (
                          <XCircle size={14} className="text-destructive" />
                        )}
                        <span className="text-xs font-medium text-foreground">
                          Test {i + 1}: {r.passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Input: </span>
                          <code className="text-foreground">{r.input}</code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Expected:{" "}
                          </span>
                          <code className="text-foreground">
                            {r.expected_output}
                          </code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Got: </span>
                          <code className="text-foreground">
                            {r.actual_output}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Problem navigation */}
      <footer className="flex items-center justify-between px-4 py-2 bg-card border-t border-border">
        <button
          onClick={() =>
            setCurrentProblemIndex((i) => Math.max(0, i - 1))
          }
          disabled={currentProblemIndex === 0}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <div className="flex items-center gap-2">
          {problems.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrentProblemIndex(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                i === currentProblemIndex
                  ? "bg-primary text-primary-foreground"
                  : isProblemSubmitted(p.id)
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() =>
            setCurrentProblemIndex((i) =>
              Math.min(problems.length - 1, i + 1)
            )
          }
          disabled={currentProblemIndex === problems.length - 1}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
}
