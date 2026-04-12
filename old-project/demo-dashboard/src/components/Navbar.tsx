import { Search, Bell, ChevronDown } from 'lucide-react'

const tabs = ['Overview', 'Submissions', 'Exams', 'Classes', 'Settings']

export default function Navbar() {
  return (
    <div className="px-3 pt-3">
      <header className="flex h-14 items-center justify-between rounded-2xl bg-card px-5">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">&lt;/&gt;</span>
            </div>
            <span className="text-lg font-bold text-foreground">CodeJudge</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === 'Overview'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Search size={18} />
          </button>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>

          <div className="ml-2 flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
            <div className="h-7 w-7 rounded-full bg-primary/30 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">SR</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-foreground leading-tight">Prof. Rahman</p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground" />
          </div>
        </div>
      </header>
    </div>
  )
}
