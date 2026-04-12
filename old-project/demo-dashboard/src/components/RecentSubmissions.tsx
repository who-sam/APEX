import { Search, SlidersHorizontal } from 'lucide-react'

const submissions = [
  {
    student: 'Alice Chen',
    avatar: 'AC',
    problem: 'Two Sum',
    language: 'Python',
    status: 'Passed',
    date: '23 Feb, 2026 03:45 PM',
  },
  {
    student: 'Bob Martinez',
    avatar: 'BM',
    problem: 'Binary Search Tree',
    language: 'Java',
    status: 'Failed',
    date: '23 Feb, 2026 02:30 PM',
  },
  {
    student: 'Sara Kim',
    avatar: 'SK',
    problem: 'Merge Sort',
    language: 'C++',
    status: 'Passed',
    date: '23 Feb, 2026 01:15 PM',
  },
  {
    student: 'David Okafor',
    avatar: 'DO',
    problem: 'Linked List Cycle',
    language: 'Python',
    status: 'Running',
    date: '23 Feb, 2026 12:50 PM',
  },
  {
    student: 'Emma Johansson',
    avatar: 'EJ',
    problem: 'Dynamic Programming',
    language: 'Go',
    status: 'Passed',
    date: '23 Feb, 2026 11:20 AM',
  },
  {
    student: 'Yuki Tanaka',
    avatar: 'YT',
    problem: 'Graph Traversal',
    language: 'JavaScript',
    status: 'Failed',
    date: '23 Feb, 2026 10:05 AM',
  },
]

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Passed: 'bg-success/15 text-success',
    Failed: 'bg-destructive/15 text-destructive',
    Running: 'bg-primary/15 text-primary',
  }[status] ?? 'bg-muted text-muted-foreground'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {status}
    </span>
  )
}

export default function RecentSubmissions() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Recent Submissions</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5">
            <Search size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Search</span>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary">
            Filter
            <SlidersHorizontal size={12} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Student</th>
              <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Problem</th>
              <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Language</th>
              <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((item, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">{item.avatar}</span>
                    </div>
                    <span className="text-sm text-foreground">{item.student}</span>
                  </div>
                </td>
                <td className="py-3 text-sm text-foreground">{item.problem}</td>
                <td className="py-3">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground font-mono">
                    {item.language}
                  </span>
                </td>
                <td className="py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="py-3 text-sm text-muted-foreground whitespace-nowrap">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
