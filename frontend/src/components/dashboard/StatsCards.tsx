import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, TrendingUp, Trophy, Clock } from "lucide-react";
import { getStudentStats } from "@/lib/api";
import type { StudentStats } from "@/lib/api";

export function StatsCards() {
  const [stats, setStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    getStudentStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  const items = [
    {
      label: "Exams Taken",
      value: stats ? String(stats.exams_taken) : "—",
      change: "",
      icon: BookOpen,
      variant: "default" as const,
    },
    {
      label: "Average Score",
      value: stats ? `${Math.round(stats.avg_score)}%` : "—",
      change: "",
      icon: TrendingUp,
      variant: "primary" as const,
    },
    {
      label: "Pass Rate",
      value: stats ? `${Math.round(stats.pass_rate)}%` : "—",
      change: "",
      icon: Trophy,
      variant: "accent" as const,
    },
    {
      label: "Submissions",
      value: stats ? String(stats.total_submissions) : "—",
      change: "",
      icon: Clock,
      variant: "default" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s) => {
        const isPrimary = s.variant === "primary";
        const isAccent = s.variant === "accent";
        const highlighted = isPrimary || isAccent;

        return (
          <Card
            key={s.label}
            className={
              highlighted
                ? isPrimary
                  ? "border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "border-accent/30 bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "border-border/50"
            }
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm font-medium ${
                    highlighted ? "opacity-90" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </p>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    highlighted ? "bg-white/20" : "bg-secondary"
                  }`}
                >
                  <s.icon
                    className={`h-4 w-4 ${
                      highlighted
                        ? "text-current"
                        : isPrimary
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight">{s.value}</p>
              {s.change && (
                <p
                  className={`mt-1 text-xs ${
                    highlighted ? "opacity-75" : "text-muted-foreground"
                  }`}
                >
                  {s.change}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
