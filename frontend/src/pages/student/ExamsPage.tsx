import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentExams, type ExamWithStatus } from "../../api";
import { BookOpen, Clock, Calendar } from "lucide-react";

type Tab = "active" | "upcoming" | "completed";

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamWithStatus[]>([]);
  const [tab, setTab] = useState<Tab>("active");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getStudentExams()
      .then(setExams)
      .finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter((e) => e.status === tab);

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
        <h1 className="text-2xl font-bold text-foreground">My Exams</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exams assigned to your classes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {(["active", "upcoming", "completed"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {t} ({exams.filter((e) => e.status === t).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">
            No {tab} exams
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((exam) => (
            <div
              key={exam.id}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => {
                if (exam.status === "active") {
                  navigate(`/exam/${exam.id}`);
                }
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">
                  {exam.title}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    exam.status === "active"
                      ? "bg-success/15 text-success"
                      : exam.status === "upcoming"
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {exam.status}
                </span>
              </div>
              {exam.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {exam.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{exam.duration_minutes} min</span>
                </div>
                {exam.start_time && (
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>
                      {new Date(exam.start_time).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <span>{exam.problem_count} problems</span>
              </div>
              {exam.status === "active" && (
                <button
                  className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/exam/${exam.id}`);
                  }}
                >
                  Start Exam
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
