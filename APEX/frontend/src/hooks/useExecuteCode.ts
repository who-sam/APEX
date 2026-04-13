import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useExecuteCode() {
  return useMutation({
    mutationFn: api.executeCode,
  });
}
