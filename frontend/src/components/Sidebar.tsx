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
  icon: React.ComponentType<{ className?: string }>;
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

function SidebarIcon({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

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
    <aside className="fixed left-4 top-20 bottom-6 z-40 flex flex-col items-center gap-3 w-14">
      {/* Spacer — push nav to center */}
      <div className="flex-1" />

      {/* Main nav group */}
      <div className="flex flex-col items-center gap-1 border border-border bg-card/80 px-1.5 py-2 shadow-lg backdrop-blur-md rounded-full">
        {navItems.map(({ icon, label, path }) => (
          <SidebarIcon
            key={label}
            icon={icon}
            label={label}
            active={isActive(path)}
            onClick={() => navigate(path)}
          />
        ))}
      </div>

      {/* Secondary nav group */}
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/80 px-1.5 py-2 shadow-lg backdrop-blur-md">
        <SidebarIcon
          icon={Settings}
          label="Settings"
          active={false}
          onClick={() => {}}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer group — Help & Logout */}
      <div className="flex flex-col items-center gap-1 border border-border bg-card/80 px-1.5 py-2 shadow-lg backdrop-blur-md rounded-full">
        <SidebarIcon
          icon={HelpCircle}
          label="Help"
          active={false}
          onClick={() => {}}
        />
        <button
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
