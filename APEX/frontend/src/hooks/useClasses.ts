import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useClasses() {
  return useQuery({ queryKey: ["classes"], queryFn: api.getClasses });
}

export function useClass(id: number) {
  return useQuery({ queryKey: ["class", id], queryFn: () => api.getClass(id), enabled: !!id });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createClass, onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }) });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; section?: string; cover_image?: string }) => api.updateClass(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteClass, onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }) });
}

export function useStudentClasses() {
  return useQuery({ queryKey: ["student-classes"], queryFn: api.getStudentClasses });
}

export function useStudentClass(id: number) {
  return useQuery({ queryKey: ["student-class", id], queryFn: () => api.getStudentClass(id), enabled: !!id });
}

export function useJoinClass() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.joinClass, onSuccess: () => qc.invalidateQueries({ queryKey: ["student-classes"] }) });
}
