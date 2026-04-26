import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useStudentStats() {
  return useQuery({ queryKey: ["student-stats"], queryFn: api.getStudentStats });
}

export function useStudentPerformance() {
  return useQuery({ queryKey: ["student-performance"], queryFn: api.getStudentPerformance });
}

export function useStudentPractice() {
  return useQuery({ queryKey: ["student-practice"], queryFn: api.getStudentPractice });
}
