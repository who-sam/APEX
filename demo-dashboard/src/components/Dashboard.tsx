import {
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Users,
  BookOpen,
  CheckCircle2,
  Plus,
  Eye,
  UserCog,
} from 'lucide-react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import SubmissionsChart from './SubmissionsChart'
import RecentSubmissions from './RecentSubmissions'

function StatCard({
  title,
  value,
  change,
  positive,
  period,
  icon: Icon,
  variant = 'default',
}: {
  title: string
  value: string
  change: string
  positive: boolean
  period: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  variant?: 'default' | 'primary'
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        variant === 'primary'
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-sm font-medium ${
            variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          }`}
        >
          {title}
        </span>
        <Icon
          size={18}
          className={variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'}
        />
      </div>
      <p
        className={`text-2xl font-bold ${
          variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {value}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        {positive ? (
          <ArrowUpRight size={14} className={variant === 'primary' ? 'text-primary-foreground/80' : 'text-success'} />
        ) : (
          <ArrowDownRight size={14} className={variant === 'primary' ? 'text-primary-foreground/80' : 'text-destructive'} />
        )}
        <span
          className={`text-xs font-medium ${
            variant === 'primary'
              ? 'text-primary-foreground/80'
              : positive
              ? 'text-success'
              : 'text-destructive'
          }`}
        >
          {change}
        </span>
        <span
          className={`text-xs ${
            variant === 'primary' ? 'text-primary-foreground/60' : 'text-muted-foreground'
          }`}
        >
          {period}
        </span>
      </div>
    </div>
  )
}

const upcomingExams = [
  { name: 'Data Structures Midterm', course: 'CS201', date: 'Feb 28, 2026', students: 45 },
  { name: 'Algorithms Final', course: 'CS301', date: 'Mar 5, 2026', students: 38 },
  { name: 'Intro to Programming Quiz', course: 'CS101', date: 'Mar 10, 2026', students: 72 },
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Navbar />

        <main className="p-6 space-y-6">
          {/* Greeting */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Good morning, Prof. Rahman</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor student progress, review submissions, and manage your exams.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Submissions"
              value="1,284"
              change="12%"
              positive={true}
              period="vs last month"
              icon={FileText}
            />
            <StatCard
              title="Active Students"
              value="156"
              change="8%"
              positive={true}
              period="vs last month"
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Upcoming Exams"
              value="3"
              change="2 this week"
              positive={true}
              period=""
              icon={BookOpen}
            />
            <StatCard
              title="Pass Rate"
              value="78.5%"
              change="3.2%"
              positive={false}
              period="vs last month"
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
                <h3 className="text-base font-semibold text-foreground mb-4">Upcoming Exams</h3>
                <div className="space-y-3">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.name}
                      className="rounded-lg border border-border bg-secondary/50 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{exam.name}</span>
                        <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {exam.course}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{exam.date}</span>
                        <span>{exam.students} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-base font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="flex w-full items-center gap-3 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Plus size={16} />
                    Create Exam
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                    <Eye size={16} />
                    View Submissions
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                    <UserCog size={16} />
                    Manage Students
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Submissions */}
          <RecentSubmissions />
        </main>
      </div>
    </div>
  )
}
