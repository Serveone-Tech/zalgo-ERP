import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertStudent } from "@shared/schema";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.students.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [api.students.list.path] }),
  });
}
