import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getExam,
  createExam,
  updateExam,
  assignExam,
  getClasses,
  addProblem,
  deleteProblem,
  type ExamData,
  type ClassData,
} from "../../api";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

export default function ExamBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [exam, setExam] = useState<ExamData | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClasses().then(setClasses);
    if (!isNew && id) {
      getExam(Number(id)).then((e) => {
        setExam(e);
        setTitle(e.title);
        setDescription(e.description || "");
        setDuration(e.duration_minutes);
        setStartTime(e.start_time ? e.start_time.slice(0, 16) : "");
        setEndTime(e.end_time ? e.end_time.slice(0, 16) : "");
        setSelectedClasses(
          e.exam_classes?.map((ec) => ec.class_id) ?? []
        );
      });
    }
  }, [id, isNew]);

  async function handleSave() {
    setSaving(true);
    try {
      const data = {
        title,
        description,
        duration_minutes: duration,
        start_time: startTime ? new Date(startTime).toISOString() : undefined,
        end_time: endTime ? new Date(endTime).toISOString() : undefined,
      };

      let examId: number;
      if (isNew) {
        const created = await createExam(data);
        examId = created.id;
      } else {
        await updateExam(Number(id), data);
        examId = Number(id);
      }

      if (selectedClasses.length > 0) {
        await assignExam(examId, selectedClasses);
      }

      navigate(`/teacher/exams/${examId}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddProblem() {
    if (!exam) return;
    const created = await addProblem(exam.id, {
      title: "New Problem",
      description: "Problem description here...",
      order_index: (exam.problems?.length ?? 0),
    });
    navigate(`/teacher/problems/${created.id}`);
  }

  async function handleDeleteProblem(problemId: number) {
    if (!confirm("Delete this problem?")) return;
    await deleteProblem(problemId);
    if (id) {
      const e = await getExam(Number(id));
      setExam(e);
    }
  }

  function toggleClass(classId: number) {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((c) => c !== classId)
        : [...prev, classId]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/teacher/exams")}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          {isNew ? "Create Exam" : "Edit Exam"}
        </h1>
      </div>

      {/* Exam Form */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Exam title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              min={1}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Exam description..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              End Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Assign to Classes */}
        {classes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Assign to Classes
            </label>
            <div className="flex flex-wrap gap-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => toggleClass(cls.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedClasses.includes(cls.id)
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {cls.name}
                  {cls.section ? ` (${cls.section})` : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Exam"}
        </button>
      </div>

      {/* Problems List (only for existing exams) */}
      {!isNew && exam && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              Problems ({exam.problems?.length ?? 0})
            </h3>
            <button
              onClick={handleAddProblem}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={14} />
              Add Problem
            </button>
          </div>

          {exam.problems && exam.problems.length > 0 ? (
            <div className="space-y-2">
              {exam.problems.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3 hover:bg-secondary/80 transition-colors cursor-pointer"
                  onClick={() => navigate(`/teacher/problems/${p.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {p.title}
                      </p>
                      <span
                        className={`text-[10px] font-medium ${
                          p.difficulty === "easy"
                            ? "text-success"
                            : p.difficulty === "hard"
                              ? "text-destructive"
                              : "text-primary"
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {p.test_cases?.length ?? 0} tests
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProblem(p.id);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No problems yet. Add your first problem.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
