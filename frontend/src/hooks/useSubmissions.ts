import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useSubmitSolution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.submitSolution,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-submissions"] });
      qc.invalidateQueries({ queryKey: ["student-stats"] });
    },
  });
}

export function useRunSolution() {
  return useMutation({ mutationFn: api.runSolution });
}

export function useSubmission(id: number) {
  return useQuery({ queryKey: ["submission", id], queryFn: () => api.getSubmission(id), enabled: !!id });
}

export function useStudentSubmissions() {
  return useQuery({ queryKey: ["student-submissions"], queryFn: api.getStudentSubmissions });
}
