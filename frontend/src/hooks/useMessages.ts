import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useMessages() {
  return useQuery({ queryKey: ["messages"], queryFn: api.getMessages });
}

export function useMessage(id: number) {
  return useQuery({ queryKey: ["message", id], queryFn: () => api.getMessage(id), enabled: !!id });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.sendMessage, onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }) });
}

export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.markMessageRead, onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }) });
}

export function useToggleMessageStar() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.toggleMessageStar, onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }) });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteMessage, onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }) });
}
