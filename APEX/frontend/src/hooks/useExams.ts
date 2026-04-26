import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useRole } from "@/contexts/AuthContext";

export function useExams() {
  const { role } = useRole();
  return useQuery({ queryKey: ["exams"], queryFn: api.getExams, enabled: role === "teacher" });
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

export function useCloseExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.closeExam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      qc.invalidateQueries({ queryKey: ["student-exams"] });
    },
  });
}

export function useReopenExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, minutes }: { id: number; minutes: number }) => api.reopenExam(id, minutes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      qc.invalidateQueries({ queryKey: ["student-exams"] });
    },
  });
}

export function useAssignExam() {
  return useMutation({ mutationFn: ({ id, classIds }: { id: number; classIds: number[] }) => api.assignExam(id, classIds) });
}

export function useStudentExams() {
  const { role } = useRole();
  return useQuery({ queryKey: ["student-exams"], queryFn: api.getStudentExams, enabled: role === "student" });
}

export function useStudentExam(id: number) {
  return useQuery({ queryKey: ["student-exam", id], queryFn: () => api.getStudentExam(id), enabled: !!id });
}

export function useExamResults(examId: number) {
  return useQuery({ queryKey: ["exam-results", examId], queryFn: () => api.getExamResults(examId), enabled: !!examId });
}
