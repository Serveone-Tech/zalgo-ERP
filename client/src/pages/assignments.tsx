import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, ClipboardList, BookOpen, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCourses } from "@/hooks/use-courses";

function useAssignments() {
  return useQuery({
    queryKey: ["/api/assignments"],
    queryFn: async () => {
      const res = await fetch("/api/assignments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}

export default function AssignmentsPage() {
  const { data: assignments, isLoading } = useAssignments();
  const { data: courses } = useCourses();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Assignment created successfully" });
      setIsOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      courseId: Number(fd.get("courseId")),
      title: fd.get("title"),
      description: fd.get("description") || null,
      dueDate: fd.get("dueDate")
        ? new Date(fd.get("dueDate") as string).toISOString()
        : null,
    });
  };

  const getCourse = (id: number) => courses?.find((c: any) => c.id === id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Assignments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and track assignments for batches
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="rounded-xl shadow-md shadow-primary/20"
              data-testid="button-add-assignment"
            >
              <Plus className="w-4 h-4 mr-2" /> New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Course / Batch *</Label>
                <select
                  name="courseId"
                  required
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select course...</option>
                  {courses?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  name="title"
                  required
                  className="rounded-xl"
                  placeholder="Assignment title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  className="rounded-xl"
                  placeholder="Instructions or details..."
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  name="dueDate"
                  type="datetime-local"
                  className="rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Assignment"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 bg-card rounded-2xl animate-pulse border border-border"
            />
          ))}
        </div>
      ) : assignments?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-dashed border-border">
          <ClipboardList className="w-14 h-14 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground font-medium">
            No assignments yet
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Create your first assignment
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments?.map((a: any) => {
            const course = getCourse(a.courseId);
            const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
            return (
              <div
                key={a.id}
                className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  {a.dueDate && (
                    <Badge
                      variant={isOverdue ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {isOverdue ? "Overdue" : "Upcoming"}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                  {a.title}
                </h3>
                {a.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {a.description}
                  </p>
                )}
                <div className="space-y-1 mt-auto pt-3 border-t border-border/40">
                  {course && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5" /> {course.name}
                    </div>
                  )}
                  {a.dueDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      Due:{" "}
                      {new Date(a.dueDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
