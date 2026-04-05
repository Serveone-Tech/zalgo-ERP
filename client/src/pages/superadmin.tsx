// client/src/pages/superadmin.tsx — REPLACE
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Clock,
  Shield,
  RefreshCw,
  AlertTriangle,
  Ban,
  LayoutGrid,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays } from "date-fns";

// ── All modules that can be controlled per plan ───────────────────────────────
const ALL_MODULES = [
  { key: "leads", label: "Enquiries / Leads" },
  { key: "students", label: "Students" },
  { key: "teachers", label: "Teachers" },
  { key: "courses", label: "Courses & Batches" },
  { key: "fees", label: "Fees & Payments" },
  { key: "inventory", label: "Inventory" },
  { key: "transactions", label: "Income / Expense" },
  { key: "communications", label: "Communications" },
  { key: "automation", label: "Automation" },
  { key: "reports", label: "Reports" },
  { key: "idcards", label: "ID Cards" },
  { key: "report-card", label: "Report Cards" },
  { key: "backups", label: "Backups" },
];

function usePlans() {
  return useQuery({
    queryKey: ["/api/plans"],
    queryFn: async () => {
      const res = await fetch("/api/plans", { credentials: "include" });
      return res.json();
    },
    staleTime: 0,
  });
}

function useAllSubscriptions() {
  return useQuery({
    queryKey: ["/api/plans/admin/subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/plans/admin/subscriptions", {
        credentials: "include",
      });
      return res.json();
    },
    staleTime: 0,
  });
}

function useAllPayments() {
  return useQuery({
    queryKey: ["/api/plans/admin/payments"],
    queryFn: async () => {
      const res = await fetch("/api/plans/admin/payments", {
        credentials: "include",
      });
      return res.json();
    },
    staleTime: 0,
  });
}

const emptyPlan = {
  name: "",
  slug: "",
  description: "",
  monthlyPrice: "",
  yearlyPrice: "",
  freeTrialDays: "",
  features: "",
  maxStudents: 500,
  maxBranches: 5,
  maxTeachers: 50,
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  allowedModules: ALL_MODULES.map((m) => m.key),
};

export default function SuperAdminDashboard() {
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: subscriptions = [], isLoading: subsLoading } =
    useAllSubscriptions();
  const { data: payments = [], isLoading: paymentsLoading } = useAllPayments();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyPlan);
  const [subFilter, setSubFilter] = useState("all");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
    queryClient.invalidateQueries({
      queryKey: ["/api/plans/admin/subscriptions"],
    });
    queryClient.invalidateQueries({ queryKey: ["/api/plans/admin/payments"] });
  };

  const createPlanMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plan created successfully" });
      setPlanModal(false);
      invalidate();
    },
    onError: (e: any) =>
      toast({
        title: e.message || "Failed to create plan",
        variant: "destructive",
      }),
  });

  const updatePlanMut = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const res = await fetch(`/api/plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plan updated successfully" });
      setPlanModal(false);
      invalidate();
    },
    onError: (e: any) =>
      toast({
        title: e.message || "Failed to update plan",
        variant: "destructive",
      }),
  });

  const deletePlanMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/plans/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast({ title: "Plan deleted" });
      invalidate();
    },
    onError: () =>
      toast({ title: "Failed to delete plan", variant: "destructive" }),
  });

  const suspendSubMut = useMutation({
    mutationFn: async ({
      subId,
      action,
    }: {
      subId: number;
      action: "suspend" | "activate";
    }) => {
      const res = await fetch(
        `/api/plans/admin/subscriptions/${subId}/${action}`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_, { action }) => {
      toast({
        title:
          action === "suspend"
            ? "Subscription suspended"
            : "Subscription activated",
      });
      invalidate();
    },
    onError: () => toast({ title: "Action failed", variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyPlan);
    setPlanModal(true);
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || "",
      slug: plan.slug || "",
      description: plan.description || "",
      // Convert paise to rupees for display
      monthlyPrice: plan.monthlyPrice ? String(plan.monthlyPrice / 100) : "",
      yearlyPrice: plan.yearlyPrice ? String(plan.yearlyPrice / 100) : "",
      freeTrialDays: plan.validityDays ? String(plan.validityDays) : "",
      features: (plan.features || []).join(", "),
      maxStudents: plan.maxStudents || 500,
      maxBranches: plan.maxBranches || 5,
      maxTeachers: plan.maxTeachers || 50,
      isActive: plan.isActive ?? true,
      isFeatured: plan.isFeatured ?? false,
      sortOrder: plan.sortOrder || 0,
      allowedModules:
        plan.allowedModules?.length > 0
          ? plan.allowedModules
          : ALL_MODULES.map((m) => m.key),
    });
    setPlanModal(true);
  };

  const handleSave = () => {
    const monthlyRs = Number(form.monthlyPrice) || 0;
    const yearlyRs = Number(form.yearlyPrice) || 0;
    const isFree = monthlyRs === 0 && yearlyRs === 0;

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      // Convert rupees to paise
      monthlyPrice: Math.round(monthlyRs * 100),
      yearlyPrice: Math.round(yearlyRs * 100),
      // validityDays: only for free plans; paid plans use 30/365 auto on backend
      validityDays:
        isFree && form.freeTrialDays ? Number(form.freeTrialDays) : null,
      maxStudents: Number(form.maxStudents),
      maxBranches: Number(form.maxBranches),
      maxTeachers: Number(form.maxTeachers),
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      features: form.features
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      allowedModules: form.allowedModules,
    };

    if (editingPlan)
      updatePlanMut.mutate({ id: editingPlan.id, data: payload });
    else createPlanMut.mutate(payload);
  };

  const toggleModule = (key: string) => {
    setForm((f: any) => {
      const has = f.allowedModules.includes(key);
      return {
        ...f,
        allowedModules: has
          ? f.allowedModules.filter((m: string) => m !== key)
          : [...f.allowedModules, key],
      };
    });
  };

  const now = new Date();
  const filteredSubs = subscriptions.filter((s: any) => {
    if (subFilter === "active") return s.subscription.status === "active";
    if (subFilter === "expired")
      return (
        s.subscription.status === "expired" ||
        s.subscription.status === "cancelled"
      );
    if (subFilter === "expiring_soon") {
      const d = differenceInDays(new Date(s.subscription.endDate), now);
      return s.subscription.status === "active" && d <= 7;
    }
    return true;
  });

  const expiringSoonCount = subscriptions.filter((s: any) => {
    const d = differenceInDays(new Date(s.subscription.endDate), now);
    return s.subscription.status === "active" && d <= 7;
  }).length;

  const activeCount = subscriptions.filter(
    (s: any) => s.subscription.status === "active",
  ).length;
  const totalRevenue = payments.reduce(
    (sum: number, p: any) => sum + (p.payment?.amount || p.amount || 0),
    0,
  );

  const isFreeForm = !Number(form.monthlyPrice) && !Number(form.yearlyPrice);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> SuperAdmin Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage plans, subscriptions, and users
        </p>
      </div>

      {expiringSoonCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {expiringSoonCount} subscription{expiringSoonCount > 1 ? "s" : ""}{" "}
              expiring within 7 days
            </p>
            <button
              onClick={() => setSubFilter("expiring_soon")}
              className="text-xs text-amber-600 dark:text-amber-300 hover:underline"
            >
              View affected users →
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Active Subscriptions",
            value: activeCount,
            icon: CheckCircle2,
            color: "text-green-500",
          },
          {
            label: "Expiring Soon",
            value: expiringSoonCount,
            icon: Clock,
            color: "text-amber-500",
          },
          {
            label: "Total Plans",
            value: plans.length,
            icon: CreditCard,
            color: "text-primary",
          },
          {
            label: "Total Revenue",
            value: `₹${(totalRevenue / 100).toLocaleString("en-IN")}`,
            icon: TrendingUp,
            color: "text-blue-500",
          },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">
            Users & Subscriptions
            {expiringSoonCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0">
                {expiringSoonCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Subscription Plans</h2>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> New Plan
            </Button>
          </div>
          {plansLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan: any) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-xl border bg-card space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{plan.name}</h3>
                        {plan.isFeatured && (
                          <Badge variant="default" className="text-xs">
                            Featured
                          </Badge>
                        )}
                        {!plan.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {plan.slug}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(plan)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete "${plan.name}"?`))
                            deletePlanMut.mutate(plan.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm space-y-0.5">
                    {plan.monthlyPrice > 0 && (
                      <p>
                        Monthly:{" "}
                        <span className="font-medium">
                          ₹{(plan.monthlyPrice / 100).toLocaleString("en-IN")}
                          /mo
                        </span>
                      </p>
                    )}
                    {plan.yearlyPrice > 0 && (
                      <p>
                        Yearly:{" "}
                        <span className="font-medium">
                          ₹{(plan.yearlyPrice / 100).toLocaleString("en-IN")}/yr
                        </span>
                      </p>
                    )}
                    {plan.monthlyPrice === 0 && plan.yearlyPrice === 0 && (
                      <p>
                        Free Trial —{" "}
                        <span className="font-medium">
                          {plan.validityDays || 20} days
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Max: {plan.maxStudents} students · {plan.maxTeachers}{" "}
                    teachers
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(plan.allowedModules || [])
                      .slice(0, 4)
                      .map((m: string) => (
                        <Badge
                          key={m}
                          variant="outline"
                          className="text-xs py-0 capitalize"
                        >
                          {m}
                        </Badge>
                      ))}
                    {(plan.allowedModules || []).length > 4 && (
                      <Badge variant="outline" className="text-xs py-0">
                        +{(plan.allowedModules || []).length - 4} more
                      </Badge>
                    )}
                    {(plan.allowedModules || []).length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        All modules
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {plans.length === 0 && (
                <div className="col-span-3 text-center py-12 text-muted-foreground text-sm">
                  No plans yet. Create your first plan.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="mt-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-semibold">Users & Subscriptions</h2>
            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "expiring_soon", label: "Expiring Soon" },
                { key: "expired", label: "Expired" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSubFilter(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${subFilter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {subsLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.map((item: any) => {
                    const daysLeft = differenceInDays(
                      new Date(item.subscription.endDate),
                      now,
                    );
                    const isExpiringSoon =
                      item.subscription.status === "active" && daysLeft <= 7;
                    return (
                      <TableRow
                        key={item.subscription.id}
                        className={isExpiringSoon ? "bg-amber-500/5" : ""}
                      >
                        <TableCell>
                          <p className="font-medium text-sm">
                            {item.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.user.email}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.plan.name}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {item.subscription.billingCycle}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.subscription.status === "active"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {isExpiringSoon && (
                              <AlertTriangle className="w-3 h-3 mr-1" />
                            )}
                            {item.subscription.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(
                            new Date(item.subscription.endDate),
                            "dd MMM yyyy",
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-medium ${daysLeft <= 3 ? "text-destructive" : daysLeft <= 7 ? "text-amber-500" : ""}`}
                          >
                            {daysLeft > 0 ? `${daysLeft}d` : "Expired"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.subscription.status === "active" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Suspend ${item.user.name}'s subscription?`,
                                  )
                                )
                                  suspendSubMut.mutate({
                                    subId: item.subscription.id,
                                    action: "suspend",
                                  });
                              }}
                              disabled={suspendSubMut.isPending}
                            >
                              <Ban className="w-3 h-3 mr-1" /> Suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-green-600 border-green-500/30 hover:bg-green-500/10"
                              onClick={() =>
                                suspendSubMut.mutate({
                                  subId: item.subscription.id,
                                  action: "activate",
                                })
                              }
                              disabled={suspendSubMut.isPending}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Activate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredSubs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="mt-4">
          <h2 className="font-semibold mb-4">Payment History</h2>
          {paymentsLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p: any) => (
                    <TableRow key={p.payment?.id || p.id}>
                      <TableCell className="text-sm">
                        {p.user?.name || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.plan?.name || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹
                        {(
                          (p.payment?.amount || p.amount || 0) / 100
                        ).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {p.payment?.billingCycle || p.billingCycle || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            (p.payment?.status || p.status) === "captured"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {p.payment?.status || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.payment?.paidAt || p.paidAt
                          ? format(
                              new Date(p.payment?.paidAt || p.paidAt),
                              "dd MMM yyyy",
                            )
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        No payments yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Plan Create/Edit Modal */}
      <Dialog open={planModal} onOpenChange={setPlanModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit Plan" : "Create New Plan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Plan Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f: any) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Basic, Pro"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f: any) => ({
                      ...f,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    }))
                  }
                  placeholder="e.g. basic, pro"
                />
              </div>

              {/* Price in Rupees */}
              <div className="space-y-1.5">
                <Label className="text-sm">Monthly Price (₹)</Label>
                <Input
                  type="number"
                  value={form.monthlyPrice}
                  onChange={(e) =>
                    setForm((f: any) => ({
                      ...f,
                      monthlyPrice: e.target.value,
                    }))
                  }
                  placeholder="0 for free"
                />
                <p className="text-xs text-muted-foreground">
                  User gets 30 days access
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Yearly Price (₹)</Label>
                <Input
                  type="number"
                  value={form.yearlyPrice}
                  onChange={(e) =>
                    setForm((f: any) => ({ ...f, yearlyPrice: e.target.value }))
                  }
                  placeholder="0 if not offered"
                />
                <p className="text-xs text-muted-foreground">
                  User gets 365 days access
                </p>
              </div>

              {/* Free trial days - only shown if both prices are 0 */}
              {isFreeForm && (
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-sm">Free Trial Days</Label>
                  <Input
                    type="number"
                    value={form.freeTrialDays}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        freeTrialDays: e.target.value,
                      }))
                    }
                    placeholder="e.g. 20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Only for free plans — after this many days the plan expires
                    and user must upgrade
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm">Max Students</Label>
                <Input
                  type="number"
                  value={form.maxStudents}
                  onChange={(e) =>
                    setForm((f: any) => ({
                      ...f,
                      maxStudents: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Max Teachers</Label>
                <Input
                  type="number"
                  value={form.maxTeachers}
                  onChange={(e) =>
                    setForm((f: any) => ({
                      ...f,
                      maxTeachers: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f: any) => ({
                      ...f,
                      sortOrder: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, description: e.target.value }))
                }
                placeholder="Short plan description"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Features (comma-separated)</Label>
              <Input
                value={form.features}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, features: e.target.value }))
                }
                placeholder="Unlimited leads, Priority support, ..."
              />
            </div>

            {/* Module access control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <Label className="text-sm font-medium">Allowed Modules</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Select which modules users on this plan can access
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border bg-muted/30">
                {ALL_MODULES.map((mod) => (
                  <label
                    key={mod.key}
                    className="flex items-center gap-2 cursor-pointer py-0.5"
                  >
                    <Checkbox
                      checked={form.allowedModules.includes(mod.key)}
                      onCheckedChange={() => toggleModule(mod.key)}
                    />
                    <span className="text-sm">{mod.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f: any) => ({
                      ...f,
                      allowedModules: ALL_MODULES.map((m) => m.key),
                    }))
                  }
                  className="text-xs text-primary hover:underline"
                >
                  Select all
                </button>
                <span className="text-xs text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f: any) => ({ ...f, allowedModules: [] }))
                  }
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Clear all
                </button>
                <span className="text-xs text-muted-foreground ml-auto">
                  {form.allowedModules.length}/{ALL_MODULES.length} selected
                </span>
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((f: any) => ({ ...f, isActive: v }))
                  }
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(v) =>
                    setForm((f: any) => ({ ...f, isFeatured: v }))
                  }
                />
                <span className="text-sm">Featured</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setPlanModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createPlanMut.isPending || updatePlanMut.isPending}
                className="flex-1"
              >
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
