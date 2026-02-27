import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Edit, BookOpen, Users, ClipboardList, FileText, Loader2, Clock, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import type { Course, Student, Enrollment, Assignment, Exam } from "@shared/schema";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs font-medium text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value || <span className="text-muted-foreground italic">Not provided</span>}</span>
    </div>
  );
}

export default function CourseViewPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const canEdit = user?.role === "admin" || user?.role === "staff";

  const courseId = Number(id);

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch course");
      return res.json();
    },
    enabled: !!courseId,
  });

  const { data: courseStudents = [] } = useQuery<{ student: Student; enrollment: Enrollment }[]>({
    queryKey: ["/api/courses", courseId, "students"],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/students`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!courseId,
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    queryFn: async () => {
      const res = await fetch("/api/assignments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });

  const { data: exams = [] } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
    queryFn: async () => {
      const res = await fetch("/api/exams", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Course>) => {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update course");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course updated successfully" });
      setIsEditOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Course not found.</p>
        <Button variant="link" onClick={() => navigate("/courses")}>Go back to Courses</Button>
      </div>
    );
  }

  const courseAssignments = assignments.filter(a => a.courseId === courseId);
  const courseExams = exams.filter(e => e.courseId === courseId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/courses")} data-testid="btn-back-courses">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{course.name}</h1>
            <p className="text-muted-foreground text-sm">{course.duration}</p>
          </div>
        </div>
        {canEdit && (
          <Button className="rounded-xl" onClick={() => setIsEditOpen(true)} data-testid="btn-edit-course">
            <Edit className="w-4 h-4 mr-2" /> Edit Course
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="pt-5 space-y-3">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <p className="font-semibold text-center">{course.name}</p>
                <Badge variant="outline" className={course.status === "Active" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-red-200 text-red-700 bg-red-50"}>
                  {course.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Students</span>
                <span className="font-semibold">{courseStudents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" />Assignments</span>
                <span className="font-semibold">{courseAssignments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Exams</span>
                <span className="font-semibold">{courseExams.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" />Course Fee</span>
                <span className="font-semibold">₹{course.fee.toLocaleString("en-IN")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Course Information</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Course Name" value={course.name} />
              <InfoRow label="Duration" value={course.duration} />
              <InfoRow label="Fee" value={`₹${course.fee.toLocaleString("en-IN")}`} />
              <InfoRow label="Status" value={course.status} />
              <InfoRow label="Description" value={course.description} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Enrolled Students ({courseStudents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {courseStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No students enrolled yet</p>
              ) : (
                <div className="space-y-2">
                  {courseStudents.map(({ student, enrollment }) => (
                    <div key={enrollment.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={student.profilePicture || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.enrollmentNo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={student.status === "Active" ? "text-xs border-emerald-200 text-emerald-700 bg-emerald-50" : "text-xs"}>
                          {student.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Enrolled {enrollment.enrolledAt ? format(new Date(enrollment.enrolledAt), "dd MMM yyyy") : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {courseAssignments.length > 0 && (
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><ClipboardList className="w-4 h-4 text-primary" />Assignments ({courseAssignments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {courseAssignments.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                      </div>
                      {a.dueDate && (
                        <div className="text-right flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Due: {format(new Date(a.dueDate), "dd MMM yyyy")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {courseExams.length > 0 && (
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Exams ({courseExams.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {courseExams.map(exam => (
                    <div key={exam.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{exam.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{exam.type}</p>
                      </div>
                      <div className="text-right">
                        {exam.date && <p className="text-xs font-medium">{format(new Date(exam.date), "dd MMM yyyy")}</p>}
                        {exam.totalMarks && <p className="text-xs text-muted-foreground">Max: {exam.totalMarks} marks</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {canEdit && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Course — {course.name}</DialogTitle>
            </DialogHeader>
            <EditCourseForm course={course} onSubmit={(data) => updateMutation.mutate(data)} isPending={updateMutation.isPending} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EditCourseForm({ course, onSubmit, isPending }: { course: Course; onSubmit: (d: Partial<Course>) => void; isPending: boolean }) {
  const [status, setStatus] = useState(course.status);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      name: fd.get("name") as string,
      description: fd.get("description") as string || null,
      duration: fd.get("duration") as string,
      fee: Number(fd.get("fee")),
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Course Name *</Label>
        <Input name="name" defaultValue={course.name} required className="rounded-xl" data-testid="input-edit-course-name" />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input name="description" defaultValue={course.description || ""} className="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Duration *</Label>
          <Input name="duration" defaultValue={course.duration} required className="rounded-xl" placeholder="e.g. 12 Months" />
        </div>
        <div className="space-y-1.5">
          <Label>Fee (₹) *</Label>
          <Input name="fee" type="number" defaultValue={course.fee} required className="rounded-xl" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" className="w-full rounded-xl" disabled={isPending} data-testid="btn-submit-edit-course">
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
