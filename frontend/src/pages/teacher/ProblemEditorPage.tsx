import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  getExam,
  getExams,
  updateProblem,
  addTestCase,
  updateTestCase,
  deleteTestCase,
  type ProblemData,
  type TestCaseData,
} from "../../api";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

export default function ProblemEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [starterCode, setStarterCode] = useState("");
  const [hints, setHints] = useState("");
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitKb, setMemoryLimitKb] = useState(262144);
  const [testCases, setTestCases] = useState<TestCaseData[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    // We need to find the problem's exam to load it with test cases
    // We'll load the problem by finding it in its exam
    loadProblem(Number(id));
  }, [id]);

  async function loadProblem(problemId: number) {
    // We fetch via a direct approach - try to update with empty to get current state
    // Actually, let's just search through the teacher's exams
    try {
      const exams = await getExams();
      for (const exam of exams) {
        const detail = await getExam(exam.id);
        const found = detail.problems?.find((p) => p.id === problemId);
        if (found) {
          setProblem(found);
          setTitle(found.title);
          setDescription(found.description);
          setDifficulty(found.difficulty);
          setStarterCode(found.starter_code || "");
          setHints(found.hints || "");
          setTimeLimitMs(found.time_limit_ms);
          setMemoryLimitKb(found.memory_limit_kb);
          setTestCases(found.test_cases ?? []);
          return;
        }
      }
    } catch {
      // Problem not found
    }
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await updateProblem(Number(id), {
        title,
        description,
        difficulty,
        starter_code: starterCode,
        hints,
        time_limit_ms: timeLimitMs,
        memory_limit_kb: memoryLimitKb,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTestCase() {
    if (!id) return;
    const tc = await addTestCase(Number(id), {
      input: "",
      expected_output: "",
      is_sample: false,
      order_index: testCases.length,
    });
    setTestCases([...testCases, tc]);
  }

  async function handleUpdateTestCase(
    tcId: number,
    field: string,
    value: string | boolean
  ) {
    const tc = testCases.find((t) => t.id === tcId);
    if (!tc) return;
    const updated = { ...tc, [field]: value };
    await updateTestCase(tcId, updated);
    setTestCases(testCases.map((t) => (t.id === tcId ? updated : t)));
  }

  async function handleDeleteTestCase(tcId: number) {
    await deleteTestCase(tcId);
    setTestCases(testCases.filter((t) => t.id !== tcId));
  }

  if (!problem) {
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
        <h1 className="text-2xl font-bold text-foreground">Edit Problem</h1>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Description (Markdown)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Hints
          </label>
          <textarea
            value={hints}
            onChange={(e) => setHints(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Optional hints for students..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Starter Code (JSON by language, e.g.{" "}
            {`{"python3": "def solution():\\n    pass"}`})
          </label>
          <div className="h-48 rounded-lg overflow-hidden border border-border">
            <Editor
              theme="vs-dark"
              language="json"
              value={starterCode}
              onChange={(v) => setStarterCode(v ?? "")}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 8 },
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Time Limit (ms)
            </label>
            <input
              type="number"
              value={timeLimitMs}
              onChange={(e) => setTimeLimitMs(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Memory Limit (KB)
            </label>
            <input
              type="number"
              value={memoryLimitKb}
              onChange={(e) => setMemoryLimitKb(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Problem"}
        </button>
      </div>

      {/* Test Cases */}
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Test Cases ({testCases.length})
          </h3>
          <button
            onClick={handleAddTestCase}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={14} />
            Add Test Case
          </button>
        </div>

        {testCases.map((tc, i) => (
          <div
            key={tc.id}
            className="rounded-lg border border-border bg-secondary/50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Test Case {i + 1}
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={tc.is_sample}
                    onChange={(e) =>
                      handleUpdateTestCase(tc.id, "is_sample", e.target.checked)
                    }
                    className="rounded"
                  />
                  Sample (visible to students)
                </label>
                <button
                  onClick={() => handleDeleteTestCase(tc.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Input
                </label>
                <textarea
                  value={tc.input}
                  onChange={(e) =>
                    handleUpdateTestCase(tc.id, "input", e.target.value)
                  }
                  onBlur={(e) =>
                    handleUpdateTestCase(tc.id, "input", e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Expected Output
                </label>
                <textarea
                  value={tc.expected_output}
                  onChange={(e) =>
                    handleUpdateTestCase(
                      tc.id,
                      "expected_output",
                      e.target.value
                    )
                  }
                  onBlur={(e) =>
                    handleUpdateTestCase(
                      tc.id,
                      "expected_output",
                      e.target.value
                    )
                  }
                  rows={3}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
