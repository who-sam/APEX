import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useAllProblems() {
  return useQuery({ queryKey: ["problems"], queryFn: api.getAllProblems });
}

export function useAddProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, data }: { examId: number; data: any }) => api.addProblem(examId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["problems"] }),
  });
}

export function useUpdateProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateProblem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["problems"] }),
  });
}

export function useDeleteProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProblem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["problems"] }),
  });
}
