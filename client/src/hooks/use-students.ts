import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertStudent } from "@shared/schema";

// ── Helper: saare student-related caches ek saath invalidate karo ─────────────
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [api.students.list.path] });
  queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
  queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
}

export function useStudents(params?: Record<string, string>) {
  const qs =
    params && Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";
  return useQuery({
    queryKey: [api.students.list.path, params],
    queryFn: async () => {
      const res = await fetch(`${api.students.list.path}${qs}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch students");
      return api.students.list.responses[200].parse(await res.json());
    },
    staleTime: 0, // always fresh
  });
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: [api.students.list.path, id],
    queryFn: async () => {
      const res = await fetch(`/api/students/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch student");
      return res.json();
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertStudent) => {
      const validated = api.students.create.input.parse(data);
      const res = await fetch(api.students.create.path, {
        method: api.students.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create student");
      return api.students.create.responses[201].parse(await res.json());
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: number } & Partial<InsertStudent>) => {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update student");
      return res.json();
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.students.delete.path, { id });
      const res = await fetch(url, {
        method: api.students.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete student");
    },
    onSuccess: () => invalidateAll(queryClient), // ← dashboard bhi refresh hoga
  });
}
