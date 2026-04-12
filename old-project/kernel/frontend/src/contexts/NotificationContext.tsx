import { createContext, useContext, ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  useNotificationsQuery,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";

interface NotificationItem {
  id: string;
  type: "exam" | "result" | "class" | "system" | "submission";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  linkTo: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data: rawNotifications } = useNotificationsQuery(isAuthenticated);
  const { data: unreadData } = useUnreadCount(isAuthenticated);
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const notifications: NotificationItem[] = isAuthenticated && rawNotifications
    ? rawNotifications.map((n: any) => ({
        id: String(n.id),
        type: n.type,
        title: n.title,
        description: n.description,
        timestamp: n.created_at
          ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
          : "",
        read: n.read,
        linkTo: n.link_to || "/dashboard",
      }))
    : [];

  const unreadCount = unreadData?.count ?? 0;

  const markAllRead = () => {
    markAllMutation.mutate();
  };

  const markAsRead = (id: string) => {
    markReadMutation.mutate(Number(id));
  };

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
