import { useQuery } from "@tanstack/react-query";
import { getMyAttempts } from "@/lib/api";

export function useMyAttempts() {
  return useQuery({ queryKey: ["my-attempts"], queryFn: getMyAttempts });
}
