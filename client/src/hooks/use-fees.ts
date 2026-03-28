import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertFee } from "@shared/schema";

// ── Helper: saare fee-related caches ek saath invalidate karo ────────────────
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [api.fees.list.path] });
  queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
  queryClient.invalidateQueries({ queryKey: ["/api/fee-installments"] });
  queryClient.invalidateQueries({ queryKey: ["/api/fee-plans"] });
}

export function useFees(params?: Record<string, string>) {
  const qs =
    params && Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";
  return useQuery({
    queryKey: [api.fees.list.path, params],
    queryFn: async () => {
      const res = await fetch(`${api.fees.list.path}${qs}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch fees");
      return api.fees.list.responses[200].parse(await res.json());
    },
    staleTime: 0,
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
    onSuccess: () => invalidateAll(queryClient),
  });
}

// ── useDeleteFee — pehle missing tha ─────────────────────────────────────────
export function useDeleteFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/fees/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete fee");
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

// ── Fee Plans ─────────────────────────────────────────────────────────────────
export function useFeePlans(params?: {
  studentId?: number;
  branchId?: number;
}) {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ),
      ).toString()
    : "";
  return useQuery({
    queryKey: ["/api/fee-plans", params],
    queryFn: async () => {
      const res = await fetch(`/api/fee-plans${qs}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch fee plans");
      return res.json();
    },
    staleTime: 0,
  });
}

export function useCreateFeePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/fee-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create fee plan");
      return res.json();
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateFeePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: number } & Record<string, any>) => {
      const res = await fetch(`/api/fee-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update fee plan");
      return res.json();
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

// ── Fee Installments ──────────────────────────────────────────────────────────
export function useFeeInstallments(params?: {
  feePlanId?: number;
  branchId?: number;
}) {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ),
      ).toString()
    : "";
  return useQuery({
    queryKey: ["/api/fee-installments", params],
    queryFn: async () => {
      const res = await fetch(`/api/fee-installments${qs}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch installments");
      return res.json();
    },
    staleTime: 0,
  });
}

export function useUpdateFeeInstallment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: number } & Record<string, any>) => {
      const res = await fetch(`/api/fee-installments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update installment");
      return res.json();
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}
