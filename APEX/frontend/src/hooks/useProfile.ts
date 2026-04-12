import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: api.getProfile });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.updateProfile, onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }) });
}

export function useChangePassword() {
  return useMutation({ mutationFn: api.changePassword });
}
