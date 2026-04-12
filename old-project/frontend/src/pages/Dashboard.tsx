import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { UpcomingExams } from "@/components/dashboard/UpcomingExams";
import { RecentResults } from "@/components/dashboard/RecentResults";
import { SkillBreakdown } from "@/components/dashboard/SkillBreakdown";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Stay on top of your exams, monitor progress, and track results.
          </p>
        </div>
        <Button size="lg" className="gap-2 text-base font-semibold shadow-lg shadow-primary/25" onClick={() => navigate("/dashboard/start")}>
          <Play className="h-5 w-5" />
          Start Practice Exam
        </Button>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Middle row: Chart + Skill Breakdown */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <PerformanceChart />
        </div>
        <div className="xl:col-span-2">
          <SkillBreakdown />
        </div>
      </div>

      {/* Bottom row: Upcoming + Results */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <UpcomingExams />
        <RecentResults />
      </div>
    </div>
  );
}
