import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useTeacherDashboard() {
  return useQuery({ queryKey: ["teacher-dashboard"], queryFn: api.getTeacherDashboard });
}
