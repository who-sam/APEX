import { createContext, useContext, useState, ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import type { AppNotification } from "@/features/social/types/notification";

interface NotificationWithDate extends Omit<AppNotification, 'timestamp'> {
  date: Date;
  timestamp: string;
}

const now = Date.now();
const initialNotifications: NotificationWithDate[] = [
  { id: "1", type: "exam" as const, title: "Midterm Exam Tomorrow", description: "CS201 Midterm starts at 10:00 AM. Make sure to review your notes.", date: new Date(now - 2 * 60 * 60 * 1000), timestamp: "", read: false, linkTo: "/dashboard/upcoming" },
  { id: "2", type: "result" as const, title: "Quiz 3 Results Published", description: "Your score: 95%. View detailed breakdown.", date: new Date(now - 5 * 60 * 60 * 1000), timestamp: "", read: false, linkTo: "/dashboard/results" },
  { id: "3", type: "class" as const, title: "Welcome to CS301", description: "You have been enrolled in CS301 - Algorithms by Prof. Smith.", date: new Date(now - 24 * 60 * 60 * 1000), timestamp: "", read: true, linkTo: "/dashboard/team" },
  { id: "4", type: "submission" as const, title: "Practice Set #12 Submitted", description: "Your submission has been received and is being graded.", date: new Date(now - 2 * 24 * 60 * 60 * 1000), timestamp: "", read: true, linkTo: "/dashboard/results" },
  { id: "5", type: "system" as const, title: "Platform Update", description: "New coding editor features are now available. Try the improved autocomplete!", date: new Date(now - 3 * 24 * 60 * 60 * 1000), timestamp: "", read: true, linkTo: "/dashboard/editor" },
  { id: "6", type: "exam" as const, title: "Pop Quiz in 30 Minutes", description: "CS201 pop quiz starting soon. Head to the exam page.", date: new Date(now - 4 * 24 * 60 * 60 * 1000), timestamp: "", read: true, linkTo: "/dashboard/upcoming" },
  { id: "7", type: "result" as const, title: "Final CS101 Graded", description: "Your final exam has been graded. Score: 91%.", date: new Date(now - 7 * 24 * 60 * 60 * 1000), timestamp: "", read: true, linkTo: "/dashboard/results" },
  { id: "8", type: "class" as const, title: "New Classmate Joined", description: "Grace Liu has joined CS201 - Data Structures.", date: new Date(now - 7 * 24 * 60 * 60 * 1000), timestamp: "", read: true, linkTo: "/dashboard/team" },
  { id: "9", type: "submission" as const, title: "Code Review Ready", description: "Your coding submission for Linked Lists has been reviewed.", date: new Date(now - 14 * 24 * 60 * 60 * 1000), timestamp: "", read: true, linkTo: "/dashboard/results" },
  { id: "10", type: "system" as const, title: "Scheduled Maintenance", description: "Platform will be down for maintenance on March 5 from 2-4 AM.", date: new Date(now - 14 * 24 * 60 * 60 * 1000), timestamp: "", read: true, linkTo: "/dashboard/help" },
].map(n => ({ ...n, timestamp: formatDistanceToNow(n.date, { addSuffix: true }) }));

interface NotificationContextType {
  notifications: NotificationWithDate[];
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markAsRead = (id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
}
