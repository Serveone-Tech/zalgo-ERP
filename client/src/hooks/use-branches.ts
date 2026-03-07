import { useQuery } from "@tanstack/react-query";
import type { Branch } from "@shared/schema";

export function useBranches() {
  return useQuery<Branch[]>({
    queryKey: ["/api/branches"],
    queryFn: async () => {
      const res = await fetch("/api/branches", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch branches");
      return res.json();
    },
  });
}
