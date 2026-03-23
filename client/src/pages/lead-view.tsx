import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  MapPin,
  BookOpen,
  Tag,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { useBranches } from "@/hooks/use-branches";
import { useCourses } from "@/hooks/use-courses";
import type { Lead, Course } from "@shared/schema";
import { BranchSelect, parseBranchId } from "@/components/branch-select";

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  "Follow-up": "bg-amber-50 text-amber-700 border-amber-200",
  Converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Dropped: "bg-red-50 text-red-700 border-red-200",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs font-medium text-muted-foreground w-36 shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground">
        {value || (
          <span className="text-muted-foreground italic">Not provided</span>
        )}
      </span>
    </div>
  );
}

export default function LeadViewPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const canEdit = user?.role === "admin" || user?.role === "staff";
  const { data: branches = [] } = useBranches();
  const { data: courses = [] } = useCourses();
  const getBranchName = (id: number | null | undefined) =>
    branches.find((b) => b.id === id)?.name ?? "—";

  const leadId = Number(id);

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ["/api/leads", leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch lead");
      return res.json();
    },
    enabled: !!leadId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update lead");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead updated successfully" });
      setIsEditOpen(false);
    },
  });

  const quickStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Status updated" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Lead not found.</p>
        <Button variant="link" onClick={() => navigate("/leads")}>
          Go back to Leads
        </Button>
      </div>
    );
  }

  const statuses = ["New", "Follow-up", "Converted", "Dropped"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => navigate("/leads")}
            data-testid="btn-back-leads"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {lead.studentName}
            </h1>
            <p className="text-muted-foreground text-sm">Enquiry #{lead.id}</p>
          </div>
        </div>
        {canEdit && (
          <Button
            className="rounded-xl"
            onClick={() => setIsEditOpen(true)}
            data-testid="btn-edit-lead"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Enquiry
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="rounded-2xl border-border/50">
            <CardContent className="pt-5 space-y-3">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <p className="font-semibold text-center">{lead.studentName}</p>
                <Badge
                  variant="outline"
                  className={STATUS_COLORS[lead.status] || ""}
                >
                  {lead.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Enquired on{" "}
                {lead.createdAt
                  ? format(new Date(lead.createdAt), "dd MMM yyyy")
                  : "N/A"}
              </p>
            </CardContent>
          </Card>

          {canEdit && (
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  Quick Status Change
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    disabled={
                      lead.status === s || quickStatusMutation.isPending
                    }
                    onClick={() => quickStatusMutation.mutate(s)}
                    data-testid={`btn-status-${s.toLowerCase()}`}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors border ${lead.status === s ? `${STATUS_COLORS[s]} cursor-default` : "border-border/40 hover:bg-muted/60 text-muted-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Student Name" value={lead.studentName} />
              <InfoRow label="Branch" value={getBranchName(lead.branchId)} />
              <InfoRow label="Status" value={lead.status} />
              <InfoRow
                label="Enquiry Date"
                value={
                  lead.createdAt
                    ? format(new Date(lead.createdAt), "dd MMM yyyy, hh:mm a")
                    : undefined
                }
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Student Phone" value={lead.phone} />
              <InfoRow label="Parent Name" value={lead.parentName} />
              <InfoRow label="Parent Phone" value={lead.parentPhone} />
              <InfoRow label="Address" value={lead.address} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Enquiry Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                label="Course Interested"
                value={lead.courseInterested}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {canEdit && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                Edit Enquiry — {lead.studentName}
              </DialogTitle>
            </DialogHeader>
            <EditLeadForm
              lead={lead}
              courses={courses}
              onSubmit={(data) => updateMutation.mutate(data)}
              isPending={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EditLeadForm({
  lead,
  courses,
  onSubmit,
  isPending,
}: {
  lead: Lead;
  courses: Course[];
  onSubmit: (d: Partial<Lead>) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState(lead.status);
  const [branchId, setBranchId] = useState(
    lead.branchId ? String(lead.branchId) : "",
  );
  // Pre-fill current course
  const [courseInterested, setCourseInterested] = useState(
    lead.courseInterested ?? "",
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      studentName: fd.get("studentName") as string,
      parentName: (fd.get("parentName") as string) || null,
      phone: fd.get("phone") as string,
      parentPhone: (fd.get("parentPhone") as string) || null,
      address: (fd.get("address") as string) || null,
      courseInterested, // Select state se le rahe hain, FormData se nahi
      status,
      branchId: parseBranchId(branchId),
    });
  };

  const activeCourses = courses.filter((c) => c.status === "Active");

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Student Name *</Label>
          <Input
            name="studentName"
            defaultValue={lead.studentName}
            required
            className="rounded-xl"
            data-testid="input-edit-lead-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Student Phone *</Label>
          <Input
            name="phone"
            defaultValue={lead.phone}
            required
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Parent Name</Label>
          <Input
            name="parentName"
            defaultValue={lead.parentName || ""}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Parent Phone</Label>
          <Input
            name="parentPhone"
            defaultValue={lead.parentPhone || ""}
            className="rounded-xl"
          />
        </div>

        {/* ── Course Select (leads wala same dropdown) ───────────────────── */}
        <div className="col-span-2 space-y-1.5">
          <Label>Course Interested *</Label>
          <Select value={courseInterested} onValueChange={setCourseInterested}>
            <SelectTrigger
              className="rounded-xl"
              data-testid="select-edit-courseInterested"
            >
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              {activeCourses.length > 0 ? (
                activeCourses.map((course) => (
                  <SelectItem key={course.id} value={course.name}>
                    {course.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="_none" disabled>
                  No active courses available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Address</Label>
          <Input
            name="address"
            defaultValue={lead.address || ""}
            className="rounded-xl"
          />
        </div>
        <div className="col-span-2">
          <BranchSelect value={branchId} onChange={setBranchId} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Follow-up">Follow-up</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
              <SelectItem value="Dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full rounded-xl"
        disabled={isPending}
        data-testid="btn-submit-edit-lead"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
