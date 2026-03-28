import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTeacher } from "@shared/schema";

// ── Helper: saare teacher-related caches ek saath invalidate karo ─────────────
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [api.teachers.list.path] });
  queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
}

export function useTeachers(params?: Record<string, string>) {
  const qs =
    params && Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";
  return useQuery({
    queryKey: [api.teachers.list.path, params],
    queryFn: async () => {
      const res = await fetch(`${api.teachers.list.path}${qs}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return api.teachers.list.responses[200].parse(await res.json());
    },
    staleTime: 0,
  });
}

export function useTeacher(id: number) {
  return useQuery({
    queryKey: [api.teachers.list.path, id],
    queryFn: async () => {
      const res = await fetch(`/api/teachers/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch teacher");
      return res.json();
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTeacher) => {
      const validated = api.teachers.create.input.parse(data);
      const res = await fetch(api.teachers.create.path, {
        method: api.teachers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create teacher");
      return api.teachers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: number } & Partial<InsertTeacher>) => {
      const res = await fetch(`/api/teachers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update teacher");
      return res.json();
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.teachers.delete.path, { id });
      const res = await fetch(url, {
        method: api.teachers.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete teacher");
    },
    onSuccess: () => invalidateAll(queryClient), // ← dashboard bhi refresh hoga
  });
}
