import { useState, useEffect } from "react";
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
import { getStudentPerformance } from "@/lib/api";
import type { PerformancePoint } from "@/lib/api";

const fallbackData: PerformancePoint[] = [
  { month: "Sep", score: 0 },
  { month: "Oct", score: 0 },
  { month: "Nov", score: 0 },
  { month: "Dec", score: 0 },
  { month: "Jan", score: 0 },
  { month: "Feb", score: 0 },
];

export function PerformanceChart() {
  const [data, setData] = useState<PerformancePoint[]>(fallbackData);

  useEffect(() => {
    getStudentPerformance()
      .then((d) => { if (d && d.length > 0) setData(d); })
      .catch(() => {});
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Score Trend
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Your average score over the last 6 months
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={28}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(20 12% 22%)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(20 10% 55%)", fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(20 10% 55%)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(20 12% 12%)",
                  border: "1px solid hsl(20 12% 22%)",
                  borderRadius: "8px",
                  color: "hsl(30 20% 90%)",
                  fontSize: 13,
                }}
                cursor={{ fill: "hsl(20 15% 18% / 0.5)" }}
              />
              <Bar
                dataKey="score"
                fill="hsl(20 90% 52%)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
