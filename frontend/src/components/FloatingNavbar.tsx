import { Search, Bell, Clock, ChevronDown, Code2, User, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavLink } from "@/components/NavLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const studentTabs = [
  { label: "Overview", url: "/dashboard" },
  { label: "My Classes", url: "/dashboard/classes" },
  { label: "Exams", url: "/dashboard/upcoming" },
  { label: "Results", url: "/dashboard/results" },
  { label: "Practice", url: "/dashboard/start" },
  { label: "Settings", url: "/dashboard/settings" },
];

const teacherTabs = [
  { label: "Overview", url: "/teacher" },
  { label: "Classes", url: "/teacher/classes" },
  { label: "Exams", url: "/teacher/exams" },
  { label: "Settings", url: "/teacher/settings" },
];

export function FloatingNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isTeacher = user?.role === "teacher";
  const navTabs = isTeacher ? teacherTabs : studentTabs;
  const basePath = isTeacher ? "/teacher" : "/dashboard";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed left-20 right-6 top-4 z-50 flex items-center gap-3 h-12">
      {/* Logo */}
      <div className="flex items-center gap-2 border border-border bg-card/80 px-4 py-1.5 shadow-lg backdrop-blur-md rounded-full">
        <Code2 className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold tracking-tight text-foreground">Kernel</span>
      </div>

      <div className="flex-1" />

      {/* Nav tabs */}
      <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1.5 shadow-lg backdrop-blur-md">
        {navTabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.url}
            end={tab.url === basePath}
            className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeClassName="bg-primary text-primary-foreground"
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="flex-1" />

      {/* Action icons */}
      <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1.5 shadow-lg backdrop-blur-md">
        {!isTeacher && (
          <button
            onClick={() => navigate("/dashboard/editor")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => navigate(`${basePath}/messages`)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
        </button>
        {!isTeacher && (
          <button
            onClick={() => navigate("/dashboard/upcoming")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Clock className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 shadow-lg backdrop-blur-md transition-colors hover:bg-secondary/50 focus:outline-none">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none text-foreground">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 z-[100] bg-card border border-border shadow-xl">
          <DropdownMenuItem onClick={() => navigate(`${basePath}/settings`)} className="cursor-pointer gap-2">
            <User className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`${basePath}/settings`)} className="cursor-pointer gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
