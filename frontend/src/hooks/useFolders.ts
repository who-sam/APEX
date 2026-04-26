import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useFolders() {
  return useQuery({ queryKey: ["folders"], queryFn: api.getFolders });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createFolder, onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }) });
}

export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string }) => api.updateFolder(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteFolder, onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }) });
}
