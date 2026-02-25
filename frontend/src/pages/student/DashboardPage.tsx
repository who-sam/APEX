import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  getStudentClasses,
  getStudentExams,
  getStudentSubmissions,
  joinClass,
  type ClassData,
  type ExamWithStatus,
  type SubmissionData,
} from "../../api";
import StatCard from "../../components/StatCard";
import { Users, BookOpen, FileText, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [exams, setExams] = useState<ExamWithStatus[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  useEffect(() => {
    getStudentClasses().then(setClasses);
    getStudentExams().then(setExams);
    getStudentSubmissions().then(setSubmissions);
  }, []);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");
    setJoinSuccess("");
    if (!inviteCode.trim()) return;
    try {
      const result = await joinClass(inviteCode.trim().toUpperCase());
      setJoinSuccess(`Joined "${result.class.name}" successfully!`);
      setInviteCode("");
      getStudentClasses().then(setClasses);
      getStudentExams().then(setExams);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join");
    }
  }

  const upcomingExams = exams.filter((e) => e.status === "upcoming").length;
  const activeExams = exams.filter((e) => e.status === "active").length;
  const avgScore =
    submissions.length > 0
      ? submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length
      : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {greeting}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          View your classes, upcoming exams, and track your progress.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Classes Joined"
          value={String(classes.length)}
          change={`${classes.length} active`}
          icon={Users}
        />
        <StatCard
          title="Active Exams"
          value={String(activeExams)}
          change={`${upcomingExams} upcoming`}
          icon={BookOpen}
          variant="primary"
        />
        <StatCard
          title="Submissions"
          value={String(submissions.length)}
          change="all time"
          icon={FileText}
          variant="accent"
        />
        <StatCard
          title="Avg Score"
          value={`${avgScore.toFixed(1)}%`}
          change={`${submissions.filter((s) => s.status === "accepted").length} accepted`}
          icon={CheckCircle2}
        />
      </div>

      {/* Join Class */}
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
        <h3 className="text-base font-semibold text-foreground mb-3">
          Join a Class
        </h3>
        <form onSubmit={handleJoin} className="flex gap-3">
          <input
            type="text"
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground font-mono uppercase tracking-wider placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-48"
            maxLength={6}
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Join
          </button>
        </form>
        {joinError && (
          <p className="mt-2 text-sm text-destructive">{joinError}</p>
        )}
        {joinSuccess && (
          <p className="mt-2 text-sm text-success">{joinSuccess}</p>
        )}
      </div>

      {/* Recent Exams */}
      {exams.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Your Exams
          </h3>
          <div className="space-y-3">
            {exams.slice(0, 5).map((exam) => (
              <div
                key={exam.id}
                className="rounded-xl border border-border/50 bg-secondary/30 p-4 flex items-center justify-between transition-colors hover:bg-secondary/60"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {exam.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{exam.duration_minutes} min</span>
                    {exam.start_time && (
                      <>
                        <span>·</span>
                        <span>
                          {new Date(exam.start_time).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                    exam.status === "active"
                      ? "bg-green-500/15 text-green-400 border-green-500/30"
                      : exam.status === "upcoming"
                        ? "bg-accent/15 text-accent border-accent/30"
                        : "bg-secondary text-muted-foreground border-border/50"
                  }`}
                >
                  {exam.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
