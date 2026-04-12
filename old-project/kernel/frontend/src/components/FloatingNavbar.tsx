import { Bell, Clock, ChevronDown, User, Settings, LogOut, Code2, Menu, Command } from "lucide-react";
import KernelLogo from "@/components/KernelLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavLink } from "@/components/NavLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

const teacherNavTabs = [
  { label: "Overview", url: "/dashboard" },
  { label: "Exams", url: "/dashboard/upcoming" },
  { label: "Exam Builder", url: "/dashboard/exam-builder" },
  { label: "Results", url: "/dashboard/results" },
  { label: "Settings", url: "/dashboard/settings" },
];

const studentNavTabs = [
  { label: "Overview", url: "/dashboard" },
  { label: "Exams", url: "/dashboard/upcoming" },
  { label: "Practice", url: "/dashboard/start" },
  { label: "Results", url: "/dashboard/results" },
  { label: "Settings", url: "/dashboard/settings" },
];

interface Props {
  onMobileMenuToggle?: () => void;
}

export function FloatingNavbar({ onMobileMenuToggle }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role ?? null;
  const name = user?.name ?? "";
  const email = user?.email ?? "";
  const { unreadCount } = useNotifications();
  const isMobile = useIsMobile();
  const navTabs = role === "teacher" ? teacherNavTabs : studentNavTabs;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const initials = name
    ? name.split(" ").filter(Boolean).map((n) => n[0]?.toUpperCase() || "").join("").slice(0, 2)
    : "";

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const searchItems = [
    { label: "Dashboard", url: "/dashboard" },
    { label: "Profile", url: "/dashboard/profile" },
    { label: "Code Editor", url: "/dashboard/editor" },
    { label: "Upcoming Exams", url: "/dashboard/upcoming" },
    { label: "Results", url: "/dashboard/results" },
    { label: "Practice", url: "/dashboard/start" },
    { label: "Messages", url: "/dashboard/messages" },
    { label: "Settings", url: "/dashboard/settings" },
    { label: "Leaderboard", url: "/dashboard/leaderboard" },
    { label: "Team", url: "/dashboard/team" },
    { label: "Help", url: "/dashboard/help" },
    { label: "Exam Builder", url: "/dashboard/exam-builder" },
    { label: "Notifications", url: "/dashboard/notifications" },
  ];

  return (
    <>
      <header className={`fixed ${isMobile ? "left-4" : "left-20"} right-6 top-4 z-50 flex items-center gap-3 h-12`}>
        {/* Mobile hamburger */}
        {isMobile && onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            aria-label="Open menu"
            className="flex items-center justify-center border border-border bg-card/80 px-3 py-1.5 shadow-lg backdrop-blur-md rounded-full"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        )}

        {/* Logo — left pill */}
        <div className="flex items-center gap-2 border border-border bg-card/80 px-4 py-1.5 shadow-lg backdrop-blur-md rounded-full">
          <KernelLogo className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight text-foreground">Kernel</span>
        </div>

        <div className="flex-1" />

        {/* Nav tabs — centered pill (hidden on mobile) */}
        {!isMobile && (
          <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1.5 shadow-lg backdrop-blur-md">
            {navTabs.map((tab) => (
              <NavLink
                key={tab.label}
                to={tab.url}
                end={tab.url === "/dashboard"}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeClassName="bg-primary text-primary-foreground"
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Action icons — separate rounded pill */}
        <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1.5 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Command className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate("/dashboard/notifications")}
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {!isMobile && (
            <button
              onClick={() => navigate("/dashboard/upcoming")}
              aria-label="Upcoming exams"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Clock className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Profile — dropdown pill */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 shadow-lg backdrop-blur-md transition-colors hover:bg-secondary/50 focus:outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!isMobile && (
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{email}</p>
                </div>
              )}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-[100] bg-card border border-border shadow-xl">
            <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer gap-2">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="cursor-pointer gap-2">
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

      {/* Search overlay */}
      <Dialog open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) setSearchQuery(""); }}>
        <DialogContent className="sm:max-w-md p-0 bg-card/95 backdrop-blur-xl border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border">
            <input
              autoFocus
              placeholder="Search pages..."
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-input"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {(() => {
              const filtered = searchItems.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
              if (filtered.length === 0) {
                return <p className="text-sm text-muted-foreground text-center py-4">No results found</p>;
              }
              return filtered.map((item) => (
                <button
                  key={item.url}
                  onClick={() => { navigate(item.url); setSearchOpen(false); setSearchQuery(""); }}
                  className="w-full text-left rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  {item.label}
                </button>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
