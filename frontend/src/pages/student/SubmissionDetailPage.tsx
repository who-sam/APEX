import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  getSubmission,
  type SubmissionData,
  type TestResultData,
} from "../../api";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

const LANGUAGE_MONACO: Record<string, string> = {
  python3: "python",
  javascript: "javascript",
  c: "c",
  cpp: "cpp",
};

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [testResults, setTestResults] = useState<TestResultData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getSubmission(Number(id))
      .then((data) => {
        setSubmission(data.submission);
        setTestResults(data.test_results);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !submission) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Submission #{submission.id}
          </h1>
          <p className="text-sm text-muted-foreground">
            {submission.language} | Score: {submission.score.toFixed(0)}% |{" "}
            {submission.passed_count}/{submission.total_count} tests passed
          </p>
        </div>
      </div>

      {/* Code */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2 text-xs text-muted-foreground bg-secondary/50 border-b border-border">
          Your Code ({submission.language})
        </div>
        <div className="h-64">
          <Editor
            theme="vs-dark"
            language={LANGUAGE_MONACO[submission.language] ?? "plaintext"}
            value={submission.code}
            options={{
              readOnly: true,
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 8 },
            }}
          />
        </div>
      </div>

      {/* Test Results */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          Test Results
        </h3>
        {testResults.map((tr, i) => (
          <div
            key={tr.id}
            className={`rounded-lg border p-4 ${
              tr.passed
                ? "border-success/30 bg-success/5"
                : "border-destructive/30 bg-destructive/5"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {tr.passed ? (
                <CheckCircle2 size={16} className="text-success" />
              ) : (
                <XCircle size={16} className="text-destructive" />
              )}
              <span className="text-sm font-medium text-foreground">
                Test Case {i + 1}
              </span>
              {tr.is_sample && (
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                  Sample
                </span>
              )}
              <span
                className={`text-xs ${
                  tr.passed ? "text-success" : "text-destructive"
                }`}
              >
                {tr.passed ? "Passed" : "Failed"}
              </span>
            </div>
            {tr.is_sample && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Input</p>
                  <pre className="rounded-md bg-secondary p-2 text-xs text-foreground font-mono overflow-auto">
                    {tr.input || "(empty)"}
                  </pre>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Expected
                  </p>
                  <pre className="rounded-md bg-secondary p-2 text-xs text-foreground font-mono overflow-auto">
                    {tr.expected_output || "(empty)"}
                  </pre>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Your Output
                  </p>
                  <pre className="rounded-md bg-secondary p-2 text-xs text-foreground font-mono overflow-auto">
                    {tr.actual_output || "(empty)"}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
