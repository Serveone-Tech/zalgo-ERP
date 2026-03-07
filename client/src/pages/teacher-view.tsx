import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Edit, GraduationCap, Phone, Mail, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { useBranches } from "@/hooks/use-branches";
import type { Teacher } from "@shared/schema";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs font-medium text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value || <span className="text-muted-foreground italic">Not provided</span>}</span>
    </div>
  );
}

export default function TeacherViewPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const canEdit = user?.role === "admin" || user?.role === "staff";
  const { data: branches = [] } = useBranches();
  const getBranchName = (id: number | null | undefined) => branches.find(b => b.id === id)?.name ?? "—";

  const teacherId = Number(id);

  const { data: teacher, isLoading } = useQuery<Teacher>({
    queryKey: ["/api/teachers", teacherId],
    queryFn: async () => {
      const res = await fetch(`/api/teachers/${teacherId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teacher");
      return res.json();
    },
    enabled: !!teacherId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Teacher>) => {
      const res = await fetch(`/api/teachers/${teacherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update teacher");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({ title: "Teacher updated successfully" });
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

  if (!teacher) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Teacher not found.</p>
        <Button variant="link" onClick={() => navigate("/teachers")}>Go back to Teachers</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/teachers")} data-testid="btn-back-teachers">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{teacher.name}</h1>
            <p className="text-muted-foreground text-sm">{teacher.subject}</p>
          </div>
        </div>
        {canEdit && (
          <Button className="rounded-xl" onClick={() => setIsEditOpen(true)} data-testid="btn-edit-teacher">
            <Edit className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="pt-6 flex flex-col items-center gap-3">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                <AvatarFallback className="bg-blue-50 text-blue-700 text-2xl font-bold">{teacher.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold text-lg">{teacher.name}</p>
                <p className="text-sm text-muted-foreground">{teacher.subject}</p>
              </div>
              <Badge variant="outline" className={teacher.status === "Active" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-red-200 text-red-700 bg-red-50"}>
                {teacher.status}
              </Badge>
              {teacher.createdAt && (
                <p className="text-xs text-muted-foreground">Joined {format(new Date(teacher.createdAt), "MMM yyyy")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" />Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Full Name" value={teacher.name} />
              <InfoRow label="Branch" value={getBranchName((teacher as any).branchId)} />
              <InfoRow label="Status" value={teacher.status} />
              <InfoRow label="Joined" value={teacher.createdAt ? format(new Date(teacher.createdAt), "dd MMM yyyy") : undefined} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Contact Details</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Phone" value={teacher.phone} />
              <InfoRow label="Email" value={teacher.email} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Professional Details</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Subject" value={teacher.subject} />
              <InfoRow label="Qualification" value={teacher.qualification} />
            </CardContent>
          </Card>
        </div>
      </div>

      {canEdit && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Teacher — {teacher.name}</DialogTitle>
            </DialogHeader>
            <EditTeacherForm teacher={teacher} onSubmit={(data) => updateMutation.mutate(data)} isPending={updateMutation.isPending} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EditTeacherForm({ teacher, onSubmit, isPending }: { teacher: Teacher; onSubmit: (d: Partial<Teacher>) => void; isPending: boolean }) {
  const [status, setStatus] = useState(teacher.status);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      subject: fd.get("subject") as string,
      qualification: fd.get("qualification") as string || null,
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Full Name *</Label>
        <Input name="name" defaultValue={teacher.name} required className="rounded-xl" data-testid="input-edit-teacher-name" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Phone *</Label>
          <Input name="phone" defaultValue={teacher.phone} required className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input name="email" type="email" defaultValue={teacher.email} required className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Subject *</Label>
          <Input name="subject" defaultValue={teacher.subject} required className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label>Qualification</Label>
          <Input name="qualification" defaultValue={teacher.qualification || ""} className="rounded-xl" />
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
      <Button type="submit" className="w-full rounded-xl" disabled={isPending} data-testid="btn-submit-edit-teacher">
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
