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

  const totalStudents = classes.reduce((sum, c) => sum + (c.member_count ?? 0), 0);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {greeting}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor student progress, review submissions, and manage your exams.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Classes"
          value={String(classes.length)}
          change={`${classes.length} active`}
          positive={true}
          period=""
          icon={FileText}
        />
        <StatCard
          title="Active Students"
          value={String(totalStudents)}
          change={`across ${classes.length} classes`}
          positive={true}
          period=""
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Upcoming Exams"
          value={String(upcomingExams.length)}
          change={`${exams.length} total`}
          positive={true}
          period=""
          icon={BookOpen}
        />
        <StatCard
          title="Total Exams"
          value={String(exams.length)}
          change="all time"
          positive={true}
          period=""
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
          <div className="rounded-xl border border-border bg-card p-5">
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
                    className="rounded-lg border border-border bg-secondary/50 p-3 space-y-1 cursor-pointer hover:border-primary/50"
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {exam.start_time
                          ? new Date(exam.start_time).toLocaleDateString()
                          : "No date"}
                      </span>
                      <span>{exam.class_count} classes</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5">
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
                className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Eye size={16} />
                View Exams
              </button>
              <button
                onClick={() => navigate("/teacher/classes")}
                className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
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
