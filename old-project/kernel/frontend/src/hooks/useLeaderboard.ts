import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useClassLeaderboard(classId: number, period = "all") {
  return useQuery({
    queryKey: ["leaderboard", "class", classId, period],
    queryFn: () => api.getClassLeaderboard(classId, period),
    enabled: !!classId,
  });
}

export function useGlobalLeaderboard(period = "all") {
  return useQuery({
    queryKey: ["leaderboard", "global", period],
    queryFn: () => api.getGlobalLeaderboard(period),
  });
}
