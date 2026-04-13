import { createContext, useContext, ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  useNotificationsQuery,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";

interface NotificationWithDate {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  linkTo: string;
}

interface NotificationContextType {
  notifications: NotificationWithDate[];
  unreadCount: number;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: rawNotifications } = useNotificationsQuery();
  const { data: unreadData } = useUnreadCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications: NotificationWithDate[] = (rawNotifications || []).map((n: any) => ({
    id: String(n.id),
    type: n.type || "system",
    title: n.title || "",
    description: n.description || n.body || "",
    timestamp: n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : "",
    read: !!n.read,
    linkTo: n.link_to || "/dashboard",
  }));

  const unreadCount = typeof unreadData === "number" ? unreadData : notifications.filter((n) => !n.read).length;

  const markAllRead = () => markAllReadMutation.mutate(undefined as any);
  const markAsRead = (id: string) => markReadMutation.mutate(Number(id));

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
