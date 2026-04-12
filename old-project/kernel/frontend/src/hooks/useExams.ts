import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useExams() {
  return useQuery({ queryKey: ["exams"], queryFn: api.getExams });
}

export function useExam(id: number) {
  return useQuery({ queryKey: ["exam", id], queryFn: () => api.getExam(id), enabled: !!id });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createExam, onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }) });
}

export function useUpdateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateExam(id, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      qc.invalidateQueries({ queryKey: ["exam", vars.id] });
    },
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteExam, onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }) });
}

export function useAssignExam() {
  return useMutation({ mutationFn: ({ id, classIds }: { id: number; classIds: number[] }) => api.assignExam(id, classIds) });
}

export function useStudentExams() {
  return useQuery({ queryKey: ["student-exams"], queryFn: api.getStudentExams });
}

export function useStudentExam(id: number) {
  return useQuery({ queryKey: ["student-exam", id], queryFn: () => api.getStudentExam(id), enabled: !!id });
}
