import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useStudentPerformance } from "@/hooks/useStudentStats";

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

export function PerformanceChart() {
  const { data: raw, isLoading } = useStudentPerformance();

  const data = (raw || []).map((item: any) => {
    const monthNum = item.month?.split("-")[1] || "";
    return {
      month: MONTH_LABELS[monthNum] || item.month,
      score: Math.round(item.avg_score ?? 0),
    };
  });

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Score Trend
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Your average score over recent months
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          {isLoading || data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "Loading..." : "No performance data yet"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barSize={28}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                    fontSize: 13,
                  }}
                  cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                />
                <Bar
                  dataKey="score"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
