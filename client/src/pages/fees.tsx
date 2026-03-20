import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BranchSelect, parseBranchId } from "@/components/branch-select";
import { useBranches } from "@/hooks/use-branches";
import { useSearch } from "wouter";
import {
  DateFilter,
  DateFilterValue,
  filterFromSearch,
  buildApiParams,
} from "@/components/date-filter";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  CreditCard,
  Receipt,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import type {
  Fee,
  FeePlan,
  FeeInstallment,
  Student,
  Course,
} from "@shared/schema";
import { useBranch } from "@/contexts/branch";

const statusBadge: Record<string, { label: string; class: string }> = {
  pending: {
    label: "Pending",
    class: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  paid: {
    label: "Paid",
    class: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  overdue: { label: "Overdue", class: "bg-red-50 text-red-700 border-red-200" },
  partial: {
    label: "Partial",
    class: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

export default function FeesPage() {
  const searchStr = useSearch();
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedBranchId } = useBranch();
  const canDelete = user?.role === "admin";
  const [addFeeOpen, setAddFeeOpen] = useState(false);
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [payInstallmentOpen, setPayInstallmentOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] =
    useState<FeeInstallment | null>(null);
  const [tab, setTab] = useState("payments");
  const [filter, setFilter] = useState<DateFilterValue>(() =>
    filterFromSearch(searchStr),
  );
  const { data: branches = [] } = useBranches();
  const getBranchName = (id: number | null | undefined) =>
    branches.find((b) => b.id === id)?.name ?? "—";

  const deleteFeeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/fees/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete fee");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      toast({ title: "Payment record deleted" });
    },
  });

  const apiParamsStr = buildApiParams(filter);
  const apiParamsObj = apiParamsStr
    ? Object.fromEntries(new URLSearchParams(apiParamsStr.slice(1)))
    : {};

  const branchParam = selectedBranchId
    ? { branchId: String(selectedBranchId) }
    : {};
  const mergedParams = { ...apiParamsObj, ...branchParam };
  const mergedQs = Object.keys(mergedParams).length
    ? "?" + new URLSearchParams(mergedParams).toString()
    : "";

  const { data: fees = [], isLoading: feesLoading } = useQuery<Fee[]>({
    queryKey: ["/api/fees", mergedParams],
    queryFn: async () => {
      const res = await fetch(`/api/fees${mergedQs}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch fees");
      return res.json();
    },
  });

  const { data: feePlans = [], isLoading: plansLoading } = useQuery<FeePlan[]>({
    queryKey: ["/api/fee-plans", branchParam],
    queryFn: async () => {
      const qs = selectedBranchId ? `?branchId=${selectedBranchId}` : "";
      const res = await fetch(`/api/fee-plans${qs}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch fee plans");
      return res.json();
    },
  });

  const { data: installments = [], isLoading: instLoading } = useQuery<
    FeeInstallment[]
  >({
    queryKey: ["/api/fee-installments", branchParam],
    queryFn: async () => {
      const qs = selectedBranchId ? `?branchId=${selectedBranchId}` : "";
      const res = await fetch(`/api/fee-installments${qs}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch installments");
      return res.json();
    },
  });
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const overdueInstallments = installments.filter(
    (i) =>
      i.status === "pending" && i.dueDate && new Date(i.dueDate) < new Date(),
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Fees & Payments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage student payments and installment plans
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <DateFilter value={filter} onChange={setFilter} />
          <Button
            variant="outline"
            onClick={() => setAddPlanOpen(true)}
            data-testid="button-add-fee-plan"
            className="gap-2"
          >
            <Calendar className="w-4 h-4" /> Fee Plan
          </Button>
          <Button
            onClick={() => setAddFeeOpen(true)}
            data-testid="button-record-payment"
            className="gap-2 shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Overdue Banner */}
      {overdueInstallments.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {overdueInstallments.length} installment(s) are overdue.
            <button
              className="ml-2 underline"
              onClick={() => setTab("installments")}
            >
              View now
            </button>
          </p>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9 bg-muted/60">
          <TabsTrigger
            value="payments"
            className="text-xs"
            data-testid="tab-payments"
          >
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="plans"
            className="text-xs"
            data-testid="tab-plans"
          >
            Fee Plans
          </TabsTrigger>
          <TabsTrigger
            value="installments"
            className="text-xs"
            data-testid="tab-installments"
          >
            Installments
            {overdueInstallments.length > 0 && (
              <span className="ml-1.5 bg-destructive text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {overdueInstallments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feesLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : fees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No payments recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  fees.map((fee) => {
                    const student = students.find(
                      (s) => s.id === fee.studentId,
                    );
                    return (
                      <TableRow key={fee.id} data-testid={`row-fee-${fee.id}`}>
                        <TableCell className="font-mono text-xs font-medium">
                          {fee.receiptNo}
                        </TableCell>
                        <TableCell className="text-sm">
                          {student ? `${student.name}` : `ID: ${fee.studentId}`}
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          ${fee.amountPaid.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            <CreditCard className="w-3 h-3" /> {fee.paymentMode}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getBranchName((student as any)?.branchId)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {fee.paymentDate
                            ? format(new Date(fee.paymentDate), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-emerald-200 text-emerald-700 bg-emerald-50 text-xs"
                          >
                            {fee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8"
                              onClick={() => deleteFeeMutation.mutate(fee.id)}
                              data-testid={`btn-delete-fee-${fee.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Fee Plans Tab */}
        <TabsContent value="plans">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plansLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-muted rounded-xl animate-pulse"
                />
              ))
            ) : feePlans.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>
                  No fee plans found. Create one to start tracking installments.
                </p>
              </div>
            ) : (
              feePlans.map((plan) => {
                const student = students.find((s) => s.id === plan.studentId);
                const progress = Math.min(
                  100,
                  Math.round(((plan.amountPaid ?? 0) / plan.netFee) * 100),
                );
                const remaining = plan.netFee - (plan.amountPaid ?? 0);
                return (
                  <Card
                    key={plan.id}
                    data-testid={`card-plan-${plan.id}`}
                    className="border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm text-foreground">
                            {student?.name ?? `Student #${plan.studentId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student?.enrollmentNo}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            plan.paymentType === "installment"
                              ? "border-blue-200 text-blue-700"
                              : "border-green-200 text-green-700"
                          }
                        >
                          {plan.paymentType === "installment"
                            ? `${plan.installmentCount} Installments`
                            : "One-time"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Total Fee
                          </span>
                          <span className="font-medium">
                            ${plan.netFee.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Paid</span>
                          <span className="font-medium text-emerald-600">
                            ${(plan.amountPaid ?? 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Remaining
                          </span>
                          <span
                            className={`font-medium ${remaining > 0 ? "text-red-600" : "text-emerald-600"}`}
                          >
                            ${remaining.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        {plan.nextDueDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Next due:{" "}
                            <span className="font-medium text-foreground">
                              {format(
                                new Date(plan.nextDueDate),
                                "MMM d, yyyy",
                              )}
                            </span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Installments Tab */}
        <TabsContent value="installments">
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : installments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No installments found
                    </TableCell>
                  </TableRow>
                ) : (
                  installments.map((inst) => {
                    const student = students.find(
                      (s) => s.id === inst.studentId,
                    );
                    const isOverdue =
                      inst.status === "pending" &&
                      inst.dueDate &&
                      new Date(inst.dueDate) < new Date();
                    const badge = isOverdue
                      ? statusBadge.overdue
                      : (statusBadge[inst.status] ?? statusBadge.pending);
                    return (
                      <TableRow
                        key={inst.id}
                        data-testid={`row-installment-${inst.id}`}
                        className={isOverdue ? "bg-red-50/30" : ""}
                      >
                        <TableCell className="text-sm font-medium">
                          {student?.name ?? `#${inst.studentId}`}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          #{inst.installmentNo}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          ${inst.amount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {inst.dueDate ? (
                            <span
                              className={
                                isOverdue
                                  ? "text-red-600 font-medium"
                                  : "text-foreground"
                              }
                            >
                              {format(new Date(inst.dueDate), "MMM d, yyyy")}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-emerald-600">
                          {inst.paidDate
                            ? format(new Date(inst.paidDate), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${badge.class}`}
                          >
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {inst.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                setSelectedInstallment(inst);
                                setPayInstallmentOpen(true);
                              }}
                              data-testid={`button-pay-installment-${inst.id}`}
                            >
                              <CheckCircle className="w-3 h-3" /> Pay
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Record Payment Dialog */}
      <Dialog open={addFeeOpen} onOpenChange={setAddFeeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Record Payment
            </DialogTitle>
          </DialogHeader>
          <RecordPaymentForm
            students={students}
            courses={courses}
            onSuccess={() => {
              setAddFeeOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Create Fee Plan Dialog */}
      <Dialog open={addPlanOpen} onOpenChange={setAddPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Create Fee Plan
            </DialogTitle>
          </DialogHeader>
          <CreateFeePlanForm
            students={students}
            courses={courses}
            onSuccess={() => {
              setAddPlanOpen(false);
              queryClient.invalidateQueries({
                queryKey: ["/api/fee-plans", "/api/fee-installments"],
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Pay Installment Dialog */}
      <Dialog open={payInstallmentOpen} onOpenChange={setPayInstallmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" /> Record
              Installment Payment
            </DialogTitle>
          </DialogHeader>
          {selectedInstallment && (
            <PayInstallmentForm
              installment={selectedInstallment}
              student={students.find(
                (s) => s.id === selectedInstallment.studentId,
              )}
              onSuccess={() => {
                setPayInstallmentOpen(false);
                queryClient.invalidateQueries({
                  queryKey: ["/api/fee-installments"],
                });
                queryClient.invalidateQueries({ queryKey: ["/api/fee-plans"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecordPaymentForm({
  students,
  courses,
  onSuccess,
}: {
  students: Student[];
  courses: Course[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [branchId, setBranchId] = useState("");

  const selectedStudent = students.find((s) => String(s.id) === studentId);

  const mut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/fees", data),
    onSuccess: () => {
      toast({ title: "Payment recorded" });
      onSuccess();
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !courseId)
      return toast({
        title: "Please select student and course",
        variant: "destructive",
      });
    const resolvedBranchId =
      parseBranchId(branchId) ?? selectedStudent?.branchId ?? null;
    mut.mutate({
      studentId: Number(studentId),
      courseId: Number(courseId),
      amountPaid: Number(amount),
      paymentMode,
      receiptNo: `RCP${Date.now().toString().slice(-8)}`,
      status: "Paid",
      branchId: resolvedBranchId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label>Student *</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger data-testid="select-fee-student">
            <SelectValue placeholder="Select student..." />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name} ({s.enrollmentNo})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Course *</Label>
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger data-testid="select-fee-course">
            <SelectValue placeholder="Select course..." />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Amount ($) *</Label>
          <Input
            data-testid="input-fee-amount"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5000"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Payment Mode</Label>
          <Select value={paymentMode} onValueChange={setPaymentMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Online">Online / UPI</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {!selectedStudent?.branchId && (
        <BranchSelect value={branchId} onChange={setBranchId} />
      )}
      <DialogFooter>
        <Button
          type="submit"
          data-testid="button-submit-payment"
          disabled={mut.isPending}
        >
          {mut.isPending ? "Saving..." : "Record Payment"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CreateFeePlanForm({
  students,
  courses,
  onSuccess,
}: {
  students: Student[];
  courses: Course[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [paymentType, setPaymentType] = useState("onetime");
  const [totalFee, setTotalFee] = useState("");
  const [discount, setDiscount] = useState("0");
  const [installmentCount, setInstallmentCount] = useState("3");
  const [startDate, setStartDate] = useState("");

  const netFee = Math.max(0, Number(totalFee) - Number(discount));

  const mut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/fee-plans", data),
    onSuccess: () => {
      toast({ title: "Fee plan created" });
      onSuccess();
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId)
      return toast({
        title: "Please select a student",
        variant: "destructive",
      });
    mut.mutate({
      studentId: Number(studentId),
      courseId: courseId ? Number(courseId) : null,
      totalFee: Number(totalFee),
      discount: Number(discount),
      netFee,
      amountPaid: 0,
      paymentType,
      installmentCount:
        paymentType === "installment" ? Number(installmentCount) : 1,
      startDate: startDate || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Student *</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger data-testid="select-plan-student">
              <SelectValue placeholder="Select student..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name} ({s.enrollmentNo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Course</Label>
          <Select
            value={courseId || "none"}
            onValueChange={(v) => setCourseId(v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (No course)</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name} — ${c.fee.toLocaleString("en-IN")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Total Fee ($) *</Label>
          <Input
            data-testid="input-total-fee"
            type="number"
            min="0"
            value={totalFee}
            onChange={(e) => setTotalFee(e.target.value)}
            placeholder="150000"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Discount ($)</Label>
          <Input
            data-testid="input-discount"
            type="number"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="col-span-2 p-3 bg-muted/40 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Net Payable Fee:</span>
            <span className="font-bold text-primary">
              ${netFee.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Payment Type</Label>
          <Select value={paymentType} onValueChange={setPaymentType}>
            <SelectTrigger data-testid="select-payment-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onetime">One-time</SelectItem>
              <SelectItem value="installment">Installments</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {paymentType === "installment" && (
          <div className="space-y-1.5">
            <Label>No. of Installments</Label>
            <Select
              value={installmentCount}
              onValueChange={setInstallmentCount}
            >
              <SelectTrigger data-testid="select-installment-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 6, 12].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} installments
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input
            type="date"
            data-testid="input-start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </div>
      {paymentType === "installment" && totalFee && (
        <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground">
          Each installment: ~$
          {Math.round(netFee / Number(installmentCount)).toLocaleString(
            "en-IN",
          )}{" "}
          per month
        </div>
      )}
      <DialogFooter>
        <Button
          type="submit"
          data-testid="button-submit-plan"
          disabled={mut.isPending}
        >
          {mut.isPending ? "Creating..." : "Create Fee Plan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PayInstallmentForm({
  installment,
  student,
  onSuccess,
}: {
  installment: FeeInstallment;
  student?: Student;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(String(installment.amount));
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [receiptNo, setReceiptNo] = useState(
    `RCP${Date.now().toString().slice(-8)}`,
  );

  const mut = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", `/api/fee-installments/${installment.id}/pay`, data),
    onSuccess: () => {
      toast({ title: "Payment recorded successfully" });
      console.log(
        `[WhatsApp Mock] Sending payment confirmation to ${student?.parentPhone}`,
      );
      onSuccess();
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate({ paidAmount: Number(amount), paymentMode, receiptNo });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="p-3 bg-muted/40 rounded-lg text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Student:</span>
          <span className="font-medium">
            {student?.name ?? `#${installment.studentId}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Installment:</span>
          <span className="font-medium">#{installment.installmentNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Due Amount:</span>
          <span className="font-bold text-primary">
            ${installment.amount.toLocaleString("en-IN")}
          </span>
        </div>
        {installment.dueDate && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due Date:</span>
            <span>{format(new Date(installment.dueDate), "MMM d, yyyy")}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Amount Paid ($) *</Label>
          <Input
            data-testid="input-installment-amount"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Payment Mode</Label>
          <Select value={paymentMode} onValueChange={setPaymentMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Online">Online / UPI</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Receipt No</Label>
          <Input
            data-testid="input-installment-receipt"
            value={receiptNo}
            onChange={(e) => setReceiptNo(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          type="submit"
          data-testid="button-confirm-payment"
          disabled={mut.isPending}
        >
          {mut.isPending ? "Processing..." : "Confirm Payment"}
        </Button>
      </DialogFooter>
    </form>
  );
}
