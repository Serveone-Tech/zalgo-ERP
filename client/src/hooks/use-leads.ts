import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertLead } from "@shared/schema";

// ── Helper: saare lead-related caches ek saath invalidate karo ───────────────
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [api.leads.list.path] });
  queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
}

export function useLeads(params?: Record<string, string>) {
  const qs =
    params && Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";
  return useQuery({
    queryKey: [api.leads.list.path, params],
    queryFn: async () => {
      const res = await fetch(`${api.leads.list.path}${qs}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch leads");
      return api.leads.list.responses[200].parse(await res.json());
    },
    staleTime: 0,
  });
}

export function useLead(id: number) {
  return useQuery({
    queryKey: [api.leads.list.path, id],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertLead) => {
      const validated = api.leads.create.input.parse(data);
      const res = await fetch(api.leads.create.path, {
        method: api.leads.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create lead");
      return api.leads.create.responses[201].parse(await res.json());
    },
    onSuccess: () => invalidateAll(queryClient), // ← dashboard bhi refresh hoga
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: number } & Partial<InsertLead>) => {
      const url = buildUrl(api.leads.update.path, { id });
      const validated = api.leads.update.input.parse(updates);
      const res = await fetch(url, {
        method: api.leads.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update lead");
      return api.leads.update.responses[200].parse(await res.json());
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.leads.delete.path, { id });
      const res = await fetch(url, {
        method: api.leads.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete lead");
    },
    onSuccess: () => invalidateAll(queryClient), // ← dashboard bhi refresh hoga
  });
}
