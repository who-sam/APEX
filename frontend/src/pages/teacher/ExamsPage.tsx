import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getExams, deleteExam, type ExamData } from "../../api";
import { BookOpen, Plus, Trash2, Clock, Calendar } from "lucide-react";

function StatusBadge({ exam }: { exam: ExamData }) {
  const now = new Date();
  const start = exam.start_time ? new Date(exam.start_time) : null;
  const end = exam.end_time ? new Date(exam.end_time) : null;

  let label = "Draft";
  let styles = "bg-muted text-muted-foreground";

  if (start && end) {
    if (now > end) {
      label = "Completed";
      styles = "bg-secondary text-muted-foreground";
    } else if (now > start) {
      label = "Active";
      styles = "bg-success/15 text-success";
    } else {
      label = "Upcoming";
      styles = "bg-primary/15 text-primary";
    }
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    try {
      const data = await getExams();
      setExams(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this exam?")) return;
    await deleteExam(id);
    loadExams();
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage exams for your classes.
          </p>
        </div>
        <button
          onClick={() => navigate("/teacher/exams/new")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Create Exam
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground">
            No exams yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first exam to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/teacher/exams/${exam.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {exam.title}
                  </h3>
                  <StatusBadge exam={exam} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(exam.id);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
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
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{exam.problem_count} problems</span>
                <span>{exam.class_count} classes</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
