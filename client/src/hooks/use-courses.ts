import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertCourse } from "@shared/schema";

export function useCourses() {
  return useQuery({
    queryKey: [api.courses.list.path],
    queryFn: async () => {
      const res = await fetch(api.courses.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch courses");
      return api.courses.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCourse) => {
      const validated = api.courses.create.input.parse(data);
      const res = await fetch(api.courses.create.path, {
        method: api.courses.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create course");
      return api.courses.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.courses.list.path] }),
  });
}

export function useCourseStudents(id: number) {
  return useQuery({
    queryKey: [api.courses.students.path, id],
    queryFn: async () => {
      const url = buildUrl(api.courses.students.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch course students");
      return api.courses.students.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.courses.delete.path, { id });
      const res = await fetch(url, { method: api.courses.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete course");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.courses.list.path] }),
  });
}
