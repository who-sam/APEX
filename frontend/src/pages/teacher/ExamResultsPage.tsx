import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getExamResults,
  getExam,
  getExamResultsExportUrl,
  type StudentResult,
  type ExamData,
} from "../../api";
import { ArrowLeft, Download } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    accepted: "bg-success/15 text-success",
    wrong_answer: "bg-destructive/15 text-destructive",
    pending: "bg-primary/15 text-primary",
    running: "bg-primary/15 text-primary",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default function ExamResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<StudentResult[]>([]);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const examId = Number(id);
    Promise.all([getExamResults(examId), getExam(examId)])
      .then(([r, e]) => {
        setResults(r);
        setExam(e);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function handleExport() {
    if (!id) return;
    const url = getExamResultsExportUrl(Number(id));
    const token = localStorage.getItem("token");
    // Open with auth header via fetch + blob
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `exam_${id}_results.csv`;
        a.click();
      });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Exam Results
            </h1>
            <p className="text-sm text-muted-foreground">
              {exam?.title}
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No submissions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Student
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Submissions
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Avg Score
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.user_id}
                    className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">
                            {r.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-foreground">{r.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-foreground">
                      {r.submissions.length}
                    </td>
                    <td className="py-3 text-sm font-medium text-foreground">
                      {r.avg_score.toFixed(1)}%
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.submissions.map((s) => (
                          <StatusBadge key={s.id} status={s.status} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
