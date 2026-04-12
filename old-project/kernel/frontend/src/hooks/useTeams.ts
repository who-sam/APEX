import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useTeams() {
  return useQuery({ queryKey: ["teams"], queryFn: api.getTeams });
}

export function useTeam(id: number) {
  return useQuery({ queryKey: ["team", id], queryFn: () => api.getTeam(id), enabled: !!id });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createTeam, onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }) });
}

export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) => api.addTeamMember(teamId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });
}
