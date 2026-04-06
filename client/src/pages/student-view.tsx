import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { parseBranchId } from "@/components/branch-select";
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  BookOpen,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type {
  Student,
  Course,
  Fee,
  FeePlan,
  FeeInstallment,
  Enrollment,
} from "@shared/schema";
import { BranchSelect } from "@/components/branch-select";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs font-medium text-muted-foreground w-32 shrink-0">
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

export default function StudentViewPage() {
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

  const studentId = Number(id);

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: ["/api/students", studentId],
    queryFn: async () => {
      const res = await fetch(`/api/students/${studentId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch student");
      return res.json();
    },
    enabled: !!studentId,
  });

  const { data: enrollments = [] } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
    queryFn: async () => {
      const res = await fetch("/api/enrollments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch enrollments");
      return res.json();
    },
  });

  const { data: fees = [] } = useQuery<Fee[]>({
    queryKey: ["/api/fees"],
    queryFn: async () => {
      const res = await fetch("/api/fees", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch fees");
      return res.json();
    },
  });

  const { data: feePlans = [] } = useQuery<FeePlan[]>({
    queryKey: ["/api/fee-plans"],
    queryFn: async () => {
      const res = await fetch("/api/fee-plans", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch fee plans");
      return res.json();
    },
  });

  const { data: installments = [] } = useQuery<FeeInstallment[]>({
    queryKey: ["/api/fee-installments"],
    queryFn: async () => {
      const res = await fetch("/api/fee-installments", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch installments");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Student>) => {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update student");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student updated successfully" });
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

  if (!student) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Student not found.</p>
        <Button variant="link" onClick={() => navigate("/students")}>
          Go back to Students
        </Button>
      </div>
    );
  }

  const studentEnrollments = enrollments.filter(
    (e) => e.studentId === studentId,
  );
  const enrolledCourses = studentEnrollments
    .map((e) => courses.find((c) => c.id === e.courseId))
    .filter(Boolean) as Course[];

  const studentFees = fees.filter((f) => f.studentId === studentId);
  const studentPlans = feePlans.filter((p) => p.studentId === studentId);
  const planIds = studentPlans.map((p) => p.id);
  const studentInstallments = installments.filter((i) =>
    planIds.includes(i.feePlanId),
  );

  // ── Fee calculations ──────────────────────────────────────────────────────────
  const totalPaid =
    studentFees.reduce((s, f) => s + f.amountPaid, 0) +
    studentInstallments
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + (i.paidAmount || 0), 0);

  const totalNetFee = studentPlans.reduce((s, p) => s + p.netFee, 0);
  const totalPaidFromPlans = studentPlans.reduce(
    (s, p) => s + (p.amountPaid || 0),
    0,
  );
  const totalRemaining = Math.max(0, totalNetFee - totalPaidFromPlans);
  const isFullyPaid = totalNetFee > 0 && totalRemaining === 0;

  const statusColor: Record<string, string> = {
    paid: "text-emerald-700 bg-emerald-50 border-emerald-200",
    pending: "text-amber-700 bg-amber-50 border-amber-200",
    overdue: "text-red-700 bg-red-50 border-red-200",
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => navigate("/students")}
            data-testid="btn-back-students"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {student.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {student.enrollmentNo}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button
            className="rounded-xl"
            onClick={() => setIsEditOpen(true)}
            data-testid="btn-edit-student"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar Card */}
          <Card className="rounded-2xl border-border/50">
            <CardContent className="pt-6 flex flex-col items-center gap-3">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                <AvatarImage src={student.profilePicture || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold text-lg">{student.name}</p>
                <p className="text-sm text-muted-foreground">
                  {student.enrollmentNo}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  student.status === "Active"
                    ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                    : "border-red-200 text-red-700 bg-red-50"
                }
              >
                {student.status}
              </Badge>
            </CardContent>
          </Card>

          {/* Fee Summary Card */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Fee Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-semibold text-emerald-700">
                  ₹{totalPaid.toLocaleString("en-IN")}
                </span>
              </div>

              {totalNetFee > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Fee</span>
                    <span className="font-medium">
                      ₹{totalNetFee.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span
                      className={`font-semibold ${isFullyPaid ? "text-emerald-700" : "text-red-600"}`}
                    >
                      {isFullyPaid
                        ? "✓ Fully Paid"
                        : `₹${totalRemaining.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${isFullyPaid ? "bg-emerald-500" : "bg-primary"}`}
                      style={{
                        width: `${Math.min(100, Math.round((totalPaidFromPlans / totalNetFee) * 100))}%`,
                      }}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee Plans</span>
                <span className="font-medium">{studentPlans.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Installments</span>
                <span className="font-medium">
                  {studentInstallments.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-medium text-red-600">
                  {
                    studentInstallments.filter((i) => i.status === "overdue")
                      .length
                  }
                </span>
              </div>

              {/* Fully paid badge */}
              {isFullyPaid && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  All fees cleared
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal Info */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Full Name" value={student.name} />
              <InfoRow label="Branch" value={getBranchName(student.branchId)} />
              <InfoRow label="Email" value={student.email} />
              <InfoRow label="Phone" value={student.phone} />
              <InfoRow label="Address" value={student.address} />
              <InfoRow label="Status" value={student.status} />
              <InfoRow
                label="Registered"
                value={
                  student.createdAt
                    ? format(new Date(student.createdAt), "dd MMM yyyy")
                    : undefined
                }
              />
            </CardContent>
          </Card>

          {/* Parent Details */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" /> Parent / Guardian
                Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Parent Name" value={student.parentName} />
              <InfoRow label="Parent Phone" value={student.parentPhone} />
            </CardContent>
          </Card>

          {/* Course Details */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Course Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                label="Course Interested"
                value={student.courseInterested}
              />
              {enrolledCourses.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Formally Enrolled
                  </p>
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-sm">{course.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.duration} · ₹
                          {course.fee.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {course.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Payments */}
          {studentFees.length > 0 && (
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Fee Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {studentFees.map((fee) => (
                    <div
                      key={fee.id}
                      className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          ₹{fee.amountPaid.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fee.paymentMode} · {fee.receiptNo}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50"
                        >
                          {fee.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fee.paymentDate
                            ? format(new Date(fee.paymentDate), "dd MMM yyyy")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fee Plans & Installments */}
          {studentPlans.length > 0 && (
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Fee Plans &
                  Installments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentPlans.map((plan) => {
                  const planInstallments = studentInstallments.filter(
                    (i) => i.feePlanId === plan.id,
                  );
                  const planPaid = plan.amountPaid || 0;
                  const planRemaining = Math.max(0, plan.netFee - planPaid);
                  const paidPct =
                    plan.netFee > 0
                      ? Math.min(
                          100,
                          Math.round((planPaid / plan.netFee) * 100),
                        )
                      : 0;
                  const planFullyPaid = plan.netFee > 0 && planRemaining === 0;

                  return (
                    <div
                      key={plan.id}
                      className="rounded-xl border border-border/50 p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {plan.paymentType === "installment"
                              ? `${plan.installmentCount} Installments`
                              : "One-time"}{" "}
                            Plan
                          </p>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>
                              Total: ₹{plan.netFee.toLocaleString("en-IN")}
                            </span>
                            <span className="text-emerald-600">
                              Paid: ₹{planPaid.toLocaleString("en-IN")}
                            </span>
                            <span
                              className={
                                planFullyPaid
                                  ? "text-emerald-600 font-medium"
                                  : "text-red-500"
                              }
                            >
                              {planFullyPaid
                                ? "✓ Cleared"
                                : `Due: ₹${planRemaining.toLocaleString("en-IN")}`}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-semibold ${planFullyPaid ? "text-emerald-600" : "text-primary"}`}
                        >
                          {paidPct}%
                        </span>
                      </div>

                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${planFullyPaid ? "bg-emerald-500" : "bg-primary"}`}
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>

                      {planInstallments.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {planInstallments.map((inst) => (
                            <div
                              key={inst.id}
                              className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                {inst.status === "paid" ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                ) : inst.status === "overdue" ? (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                                )}
                                <span className="text-xs font-medium">
                                  Installment #{inst.installmentNo}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-medium">
                                  ₹{inst.amount.toLocaleString("en-IN")}
                                </p>
                                {inst.status === "paid" && inst.paidAmount ? (
                                  <p className="text-xs text-emerald-600">
                                    Paid: ₹
                                    {inst.paidAmount.toLocaleString("en-IN")}
                                  </p>
                                ) : inst.dueDate ? (
                                  <p className="text-xs text-muted-foreground">
                                    Due:{" "}
                                    {format(
                                      new Date(inst.dueDate),
                                      "dd MMM yyyy",
                                    )}
                                  </p>
                                ) : null}
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-xs ml-2 ${statusColor[inst.status] || ""}`}
                              >
                                {inst.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {canEdit && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                Edit Student — {student.name}
              </DialogTitle>
            </DialogHeader>
            <EditStudentForm
              student={student}
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

function EditStudentForm({
  student,
  courses,
  onSubmit,
  isPending,
}: {
  student: Student;
  courses: Course[];
  onSubmit: (data: Partial<Student>) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState(student.status);
  const [branchId, setBranchId] = useState(
    student.branchId ? String(student.branchId) : "",
  );
  const [courseInterested, setCourseInterested] = useState(
    student.courseInterested ?? "",
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      name: fd.get("name") as string,
      email: (fd.get("email") as string) || null,
      phone: fd.get("phone") as string,
      parentName: (fd.get("parentName") as string) || null,
      parentPhone: fd.get("parentPhone") as string,
      address: (fd.get("address") as string) || null,
      enrollmentNo: fd.get("enrollmentNo") as string,
      status,
      branchId: parseBranchId(branchId),
      courseInterested:
        courseInterested === "_none" ? null : courseInterested || null,
    });
  };

  const activeCourses = courses.filter((c) => c.status === "Active");

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Full Name *</Label>
          <Input
            name="name"
            defaultValue={student.name}
            required
            className="rounded-xl"
            data-testid="input-edit-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Enrollment No *</Label>
          <Input
            name="enrollmentNo"
            defaultValue={student.enrollmentNo}
            required
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Alumni">Alumni</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Phone *</Label>
          <Input
            name="phone"
            defaultValue={student.phone}
            required
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            name="email"
            type="email"
            defaultValue={student.email || ""}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Parent Name</Label>
          <Input
            name="parentName"
            defaultValue={student.parentName || ""}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Parent Phone</Label>
          <Input
            name="parentPhone"
            defaultValue={student.parentPhone || ""}
            className="rounded-xl"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Address</Label>
          <Input
            name="address"
            defaultValue={student.address || ""}
            className="rounded-xl"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Course Interested</Label>
          <Select value={courseInterested} onValueChange={setCourseInterested}>
            <SelectTrigger
              className="rounded-xl"
              data-testid="select-edit-course"
            >
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">— None —</SelectItem>
              {activeCourses.length > 0 ? (
                activeCourses.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="_empty" disabled>
                  No active courses available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <BranchSelect value={branchId} onChange={setBranchId} />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full rounded-xl"
        disabled={isPending}
        data-testid="btn-submit-edit-student"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
