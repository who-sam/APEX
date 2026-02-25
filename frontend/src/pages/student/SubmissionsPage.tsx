import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentSubmissions, type SubmissionData } from "../../api";
import { FileText } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    accepted: "bg-success/15 text-success",
    wrong_answer: "bg-destructive/15 text-destructive",
    pending: "bg-primary/15 text-primary",
    running: "bg-primary/15 text-primary",
    compilation_error: "bg-destructive/15 text-destructive",
    time_limit_exceeded: "bg-destructive/15 text-destructive",
    runtime_error: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getStudentSubmissions()
      .then(setSubmissions)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Submissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your submission history across all exams.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-12 text-center">
          <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">
            No submissions yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete exam problems to see your submissions here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Problem
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Language
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/student/submissions/${sub.id}`)}
                  >
                    <td className="py-3 text-sm text-foreground">
                      {sub.problem?.title ?? `Problem #${sub.problem_id}`}
                    </td>
                    <td className="py-3">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground font-mono">
                        {sub.language}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-medium text-foreground">
                      {sub.score.toFixed(0)}%
                      <span className="text-xs text-muted-foreground ml-1">
                        ({sub.passed_count}/{sub.total_count})
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
