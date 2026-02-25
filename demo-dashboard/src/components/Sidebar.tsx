import {
  LayoutGrid,
  Code2,
  Users,
  BookOpen,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react'

const navIcons = [
  { icon: LayoutGrid, label: 'Dashboard', active: true },
  { icon: Code2, label: 'Code Editor' },
  { icon: Users, label: 'Students' },
  { icon: BookOpen, label: 'Exams' },
  { icon: FileText, label: 'Submissions' },
]

const bottomIcons = [
  { icon: Settings, label: 'Settings' },
  { icon: HelpCircle, label: 'Help' },
  { icon: LogOut, label: 'Logout' },
]

export default function Sidebar() {
  return (
    <div className="p-3 flex items-center h-screen sticky top-0">
      <aside className="flex w-14 flex-col items-center justify-between rounded-2xl bg-card py-5 gap-4 h-[calc(100vh-24px)]">
        <div className="flex flex-col items-center gap-2">
          {navIcons.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              title={label}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          {bottomIcons.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title={label}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
