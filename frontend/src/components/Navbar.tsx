import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Search, Bell, Clock, ChevronDown, Code2 } from "lucide-react";

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
    <header className="fixed left-20 right-6 top-4 z-50 flex items-center gap-3 h-12">
      {/* Logo — left pill */}
      <div className="flex items-center gap-2 border border-border bg-card/80 px-4 py-1.5 shadow-lg backdrop-blur-md rounded-full">
        <Code2 className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold tracking-tight text-foreground">
          Code<span className="text-muted-foreground">Judge</span>
        </span>
      </div>

      <div className="flex-1" />

      {/* Nav tabs — centered pill */}
      <div className="hidden md:flex items-center gap-1 rounded-2xl border border-border bg-card/80 px-2 py-1.5 shadow-lg backdrop-blur-md">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
              isActive(tab.path)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Action icons — separate rounded pill */}
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-card/80 px-2 py-1.5 shadow-lg backdrop-blur-md">
        <button className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Search className="h-4 w-4" />
        </button>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Clock className="h-4 w-4" />
        </button>
      </div>

      {/* Profile — separate rounded pill */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-3 py-1.5 shadow-lg backdrop-blur-md">
        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">{initials}</span>
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-sm font-medium leading-none text-foreground">
            {user?.name}
          </p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </header>
  );
}
