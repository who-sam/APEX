import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutGrid,
  Code2,
  Users,
  BookOpen,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";

interface NavItem {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  path: string;
}

const teacherNav: NavItem[] = [
  { icon: LayoutGrid, label: "Dashboard", path: "/teacher" },
  { icon: Code2, label: "Playground", path: "/editor" },
  { icon: Users, label: "Classes", path: "/teacher/classes" },
  { icon: BookOpen, label: "Exams", path: "/teacher/exams" },
  { icon: FileText, label: "Submissions", path: "/teacher/submissions" },
];

const studentNav: NavItem[] = [
  { icon: LayoutGrid, label: "Dashboard", path: "/student" },
  { icon: Code2, label: "Playground", path: "/editor" },
  { icon: Users, label: "Classes", path: "/student/classes" },
  { icon: BookOpen, label: "Exams", path: "/student/exams" },
  { icon: FileText, label: "Submissions", path: "/student/submissions" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = user?.role === "teacher" ? teacherNav : studentNav;

  function isActive(path: string) {
    if (path === "/teacher" || path === "/student") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="p-3 flex items-center h-screen sticky top-0">
      <aside className="flex w-14 flex-col items-center justify-between rounded-2xl bg-card py-5 gap-4 h-[calc(100vh-24px)]">
        <div className="flex flex-col items-center gap-2">
          {navItems.map(({ icon: Icon, label, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                isActive(path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              title={label}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Help"
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </div>
  );
}
