import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTeacher } from "@shared/schema";

export function useTeachers(params?: Record<string, string>) {
  const qs = params && Object.keys(params).length ? "?" + new URLSearchParams(params).toString() : "";
  return useQuery({
    queryKey: [api.teachers.list.path, params],
    queryFn: async () => {
      const res = await fetch(`${api.teachers.list.path}${qs}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return api.teachers.list.responses[200].parse(await res.json());
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teachers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.teachers.delete.path, { id });
      const res = await fetch(url, { method: api.teachers.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete teacher");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.teachers.list.path] }),
  });
}
