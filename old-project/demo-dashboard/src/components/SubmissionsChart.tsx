import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const data = [
  { month: 'Jan', passed: 120, failed: 35 },
  { month: 'Feb', passed: 145, failed: 42 },
  { month: 'Mar', passed: 98, failed: 55 },
  { month: 'Apr', passed: 180, failed: 30 },
  { month: 'May', passed: 210, failed: 48 },
  { month: 'Jun', passed: 165, failed: 38 },
  { month: 'Jul', passed: 230, failed: 52 },
  { month: 'Aug', passed: 195, failed: 44 },
]

export default function SubmissionsChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Submissions Overview</h3>
          <p className="text-xs text-muted-foreground">Passed vs Failed submissions per month</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Passed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground">Failed</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={2} barSize={16}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(20 12% 22%)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(20 10% 55%)', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(20 10% 55%)', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(20 12% 12%)',
              border: '1px solid hsl(20 12% 22%)',
              borderRadius: '8px',
              color: 'hsl(30 20% 90%)',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="passed" fill="hsl(20 90% 52%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="failed" fill="hsl(20 10% 35%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
