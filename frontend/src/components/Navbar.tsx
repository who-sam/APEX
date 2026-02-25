import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Search, Bell, ChevronDown } from "lucide-react";

interface Tab {
  label: string;
  path: string;
}

const teacherTabs: Tab[] = [
  { label: "Overview", path: "/teacher" },
  { label: "Classes", path: "/teacher/classes" },
  { label: "Exams", path: "/teacher/exams" },
  { label: "Settings", path: "/teacher/settings" },
];

const studentTabs: Tab[] = [
  { label: "Overview", path: "/student" },
  { label: "Classes", path: "/student/classes" },
  { label: "Exams", path: "/student/exams" },
  { label: "Submissions", path: "/student/submissions" },
];

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = user?.role === "teacher" ? teacherTabs : studentTabs;

  function isActive(path: string) {
    if (path === "/teacher" || path === "/student") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="px-3 pt-3">
      <header className="flex h-14 items-center justify-between rounded-2xl bg-card px-5">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                &lt;/&gt;
              </span>
            </div>
            <span className="text-lg font-bold text-foreground">CodeJudge</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive(tab.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {tab.label}
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
              <span className="text-xs font-bold text-primary">{initials}</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-foreground leading-tight">
                {user?.name}
              </p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground" />
          </div>
        </div>
      </header>
    </div>
  );
}
