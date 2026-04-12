import {
  BarChart3,
  Calendar,
  ClipboardCheck,
  Code2,
  HelpCircle,
  LogOut,
  Mail,
  Settings,
  Users,
  Sun,
  Moon,
  FilePlus2,
  GraduationCap,
  User,
  Trophy,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRole, useUser } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";

const teacherMainItems = [
  { icon: BarChart3, url: "/dashboard", label: "Dashboard" },
  { icon: FilePlus2, url: "/dashboard/exam-builder", label: "Exam Builder" },
  { icon: Calendar, url: "/dashboard/exams", label: "Exams" },
  { icon: ClipboardCheck, url: "/dashboard/results", label: "Results" },
  { icon: Users, url: "/dashboard/team", label: "Team" },
  { icon: Mail, url: "/dashboard/messages", label: "Messages" },
];

const teacherSecondaryItems: typeof teacherMainItems = [];

const studentMainItems = [
  { icon: BarChart3, url: "/dashboard", label: "Dashboard" },
  { icon: User, url: "/dashboard/profile", label: "Profile" },
  { icon: Trophy, url: "/dashboard/leaderboard", label: "Leaderboard" },
  { icon: Code2, url: "/dashboard/playground", label: "Code Editor" },
  { icon: Calendar, url: "/dashboard/exams", label: "Exams" },
  { icon: ClipboardCheck, url: "/dashboard/results", label: "Results" },
  { icon: GraduationCap, url: "/dashboard/practice", label: "Practice" },
  { icon: Mail, url: "/dashboard/messages", label: "Messages" },
];

const studentSecondaryItems: typeof studentMainItems = [];

interface SidebarIconProps {
  icon: React.ElementType;
  url: string;
  label: string;
  end?: boolean;
  onClick?: () => void;
}

function SidebarIcon({ icon: Icon, url, label, end, onClick }: SidebarIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={url}
          end={end}
          onClick={onClick}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeClassName="bg-primary/15 text-primary"
        >
          <Icon className="h-5 w-5" />
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface AppSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ mobile, onNavigate }: AppSidebarProps) {
  const { role, clearRole } = useRole();
  const { setUser } = useUser();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const mainItems = role === "teacher" ? teacherMainItems : studentMainItems;
  const secondaryItems = role === "teacher" ? teacherSecondaryItems : studentSecondaryItems;

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const handleLogout = () => {
    clearRole();
    setUser({ firstName: "", lastName: "", email: "" });
    navigate("/");
  };

  if (mobile) {
    return (
      <div className="flex flex-col gap-2 pt-4">
        <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Navigation</p>
        {mainItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.url}
            end={item.url === "/dashboard"}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeClassName="bg-primary/15 text-primary font-medium"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        <div className="border-t border-border my-2" />
        <NavLink
          to="/dashboard/help"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          activeClassName="bg-primary/15 text-primary font-medium"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </NavLink>
        <button
          onClick={() => { toggleTheme(); }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    );
  }

  return (
    <aside className="fixed left-4 top-20 bottom-6 z-40 flex flex-col items-center gap-3 w-14">
      {/* Theme toggle — top */}
      <div className="flex flex-col items-center border border-border bg-card/80 px-1.5 py-1.5 shadow-lg backdrop-blur-md rounded-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {isDark ? "Light mode" : "Dark mode"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1" />

      {/* Main nav group — centered */}
      <div className="flex flex-col items-center gap-1 border border-border bg-card/80 px-1.5 py-2 shadow-lg backdrop-blur-md rounded-full">
        {mainItems.map((item) => (
          <SidebarIcon key={item.label} {...item} end={item.url === "/dashboard"} />
        ))}
      </div>

      {/* Secondary nav group — centered */}
      {secondaryItems.length > 0 && (
        <div className="flex flex-col items-center gap-1 rounded-full border border-border bg-card/80 px-1.5 py-2 shadow-lg backdrop-blur-md">
          {secondaryItems.map((item) => (
            <SidebarIcon key={item.label} {...item} />
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* Footer group — Help & Logout */}
      <div className="flex flex-col items-center gap-1 border border-border bg-card/80 px-1.5 py-2 shadow-lg backdrop-blur-md rounded-full">
        <SidebarIcon icon={HelpCircle} url="/dashboard/help" label="Help" />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Logout
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
