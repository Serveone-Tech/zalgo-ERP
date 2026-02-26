import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertFee } from "@shared/schema";

export function useFees() {
  return useQuery({
    queryKey: [api.fees.list.path],
    queryFn: async () => {
      const res = await fetch(api.fees.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch fees");
      return api.fees.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFee) => {
      const validated = api.fees.create.input.parse(data);
      const res = await fetch(api.fees.create.path, {
        method: api.fees.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create fee record");
      return api.fees.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fees.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
