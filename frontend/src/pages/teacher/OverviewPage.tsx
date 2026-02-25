import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getClasses, getExams, type ClassData, type ExamData } from "../../api";
import StatCard from "../../components/StatCard";
import SubmissionsChart from "../../components/SubmissionsChart";
import {
  FileText,
  Users,
  BookOpen,
  CheckCircle2,
  Plus,
  Eye,
  UserCog,
  Play,
} from "lucide-react";

export default function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);

  useEffect(() => {
    getClasses().then(setClasses);
    getExams().then(setExams);
  }, []);

  const totalStudents = classes.reduce(
    (sum, c) => sum + (c.member_count ?? 0),
    0
  );
  const now = new Date();
  const upcomingExams = exams.filter((e) => {
    if (!e.start_time) return false;
    return new Date(e.start_time) > now;
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Monitor student progress, review submissions, and manage your exams.
          </p>
        </div>
        <button
          onClick={() => navigate("/teacher/exams/new")}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
        >
          <Play className="h-5 w-5" />
          Create Exam
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Classes"
          value={String(classes.length)}
          change={`${classes.length} active`}
          icon={FileText}
        />
        <StatCard
          title="Active Students"
          value={String(totalStudents)}
          change={`across ${classes.length} classes`}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Upcoming Exams"
          value={String(upcomingExams.length)}
          change={`${exams.length} total`}
          icon={BookOpen}
          variant="accent"
        />
        <StatCard
          title="Total Exams"
          value={String(exams.length)}
          change="all time"
          icon={CheckCircle2}
        />
      </div>

      {/* Chart + Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <SubmissionsChart />
        </div>

        <div className="lg:col-span-4 space-y-5">
          {/* Upcoming Exams */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Upcoming Exams
            </h3>
            <div className="space-y-3">
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No upcoming exams.
                </p>
              ) : (
                upcomingExams.slice(0, 3).map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-xl border border-border/50 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60 cursor-pointer"
                    onClick={() => navigate(`/teacher/exams/${exam.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {exam.title}
                      </span>
                      <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {exam.duration_minutes}min
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>
                        {exam.start_time
                          ? new Date(exam.start_time).toLocaleDateString()
                          : "No date"}
                      </span>
                      <span>·</span>
                      <span>{exam.class_count} classes</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-md p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/teacher/exams/new")}
                className="flex w-full items-center gap-3 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus size={16} />
                Create Exam
              </button>
              <button
                onClick={() => navigate("/teacher/exams")}
                className="flex w-full items-center gap-3 rounded-lg border border-border/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
              >
                <Eye size={16} />
                View Exams
              </button>
              <button
                onClick={() => navigate("/teacher/classes")}
                className="flex w-full items-center gap-3 rounded-lg border border-border/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
              >
                <UserCog size={16} />
                Manage Classes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
