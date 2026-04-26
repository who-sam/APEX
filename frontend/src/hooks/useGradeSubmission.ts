import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { score: number; status: string } }) =>
      api.gradeSubmission(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam-results"] });
      qc.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}
