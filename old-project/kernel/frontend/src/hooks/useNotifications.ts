import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: api.getNotifications,
    refetchInterval: 30000,
    enabled,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ["notifications-unread"],
    queryFn: api.getUnreadNotificationCount,
    refetchInterval: 30000,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}
