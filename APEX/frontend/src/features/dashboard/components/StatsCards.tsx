import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, TrendingUp, Trophy, Clock } from "lucide-react";

const stats = [
  {
    label: "Exams Taken",
    value: "24",
    change: "+3 this month",
    icon: BookOpen,
    variant: "default" as const,
  },
  {
    label: "Average Score",
    value: "82%",
    change: "↑ 5% vs last month",
    icon: TrendingUp,
    variant: "primary" as const,
  },
  {
    label: "Pass Rate",
    value: "87%",
    change: "↑ 2% vs last month",
    icon: Trophy,
    variant: "accent" as const,
  },
  {
    label: "Hours Spent",
    value: "48h",
    change: "+6h this week",
    icon: Clock,
    variant: "default" as const,
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => {
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
              <p
                className={`mt-1 text-xs ${
                  highlighted ? "opacity-75" : "text-muted-foreground"
                }`}
              >
                {s.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
