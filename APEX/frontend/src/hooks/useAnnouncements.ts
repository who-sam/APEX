import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useAnnouncements(classId: number) {
  return useQuery({
    queryKey: ["announcements", classId],
    queryFn: () => api.getAnnouncements(classId),
    enabled: !!classId,
  });
}

export function useCreateAnnouncement(classId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; body?: string; attachments?: string }) => api.createAnnouncement(classId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements", classId] });
    },
  });
}

export function useUpdateAnnouncement(classId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title?: string; body?: string; attachments?: string } }) =>
      api.updateAnnouncement(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements", classId] });
    },
  });
}

export function useDeleteAnnouncement(classId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements", classId] });
    },
  });
}
