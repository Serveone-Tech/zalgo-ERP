import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, TrendingUp, TrendingDown, BookOpen, CreditCard, GraduationCap, UserSquare2, IndianRupee, AlertCircle } from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard";

function useStudentStats() {
  return useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const res = await fetch("/api/students", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}

function useFeesReport() {
  return useQuery({
    queryKey: ["/api/fees"],
    queryFn: async () => {
      const res = await fetch("/api/fees", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}

function useTransactionsReport() {
  return useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}

function useInstallmentsReport() {
  return useQuery({
    queryKey: ["/api/fee-installments"],
    queryFn: async () => {
      const res = await fetch("/api/fee-installments", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}

function StatCard({ title, value, icon: Icon, color, subtitle }: any) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const { data: dashboard } = useDashboardStats();
  const { data: students } = useStudentStats();
  const { data: fees } = useFeesReport();
  const { data: transactions } = useTransactionsReport();
  const { data: installments } = useInstallmentsReport();

  const activeStudents = students?.filter((s: any) => s.status === "Active").length || 0;
  const inactiveStudents = students?.filter((s: any) => s.status !== "Active").length || 0;

  // Fee collections
  const directFeeCollected = fees?.reduce((s: number, f: any) => s + f.amountPaid, 0) || 0;
  const paidInstallmentsTotal = installments?.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (i.paidAmount ?? 0), 0) || 0;
  const totalFeeCollected = Math.max(directFeeCollected, paidInstallmentsTotal);
  const pendingInstallments = installments?.filter((i: any) => i.status === "pending") || [];
  const totalPending = pendingInstallments.reduce((s: number, i: any) => s + (i.amount - (i.paidAmount ?? 0)), 0);

  // Transactions
  const incomeTransactions = transactions?.filter((t: any) => t.type === "Income") || [];
  const expenseTransactions = transactions?.filter((t: any) => t.type === "Expense") || [];
  const totalIncome = incomeTransactions.reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((s: number, t: any) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Payment mode breakdown
  const paymentModes = fees?.reduce((acc: any, f: any) => {
    acc[f.paymentMode] = (acc[f.paymentMode] || 0) + f.amountPaid;
    return acc;
  }, {});

  // Expense category breakdown
  const expenseByCategory = expenseTransactions.reduce((acc: any, t: any) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  // Income category breakdown
  const incomeByCategory = incomeTransactions.reduce((acc: any, t: any) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of all modules and key metrics</p>
      </div>

      {/* Overview Stats */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Students" value={dashboard?.totalStudents || 0} icon={Users} color="bg-primary/10 text-primary" subtitle={`${activeStudents} active, ${inactiveStudents} inactive`} />
          <StatCard title="Active Enquiries" value={dashboard?.activeLeads || 0} icon={UserSquare2} color="bg-amber-50 text-amber-600" subtitle="Status: New" />
          <StatCard title="Total Teachers" value={dashboard?.totalTeachers || 0} icon={GraduationCap} color="bg-purple-50 text-purple-600" />
          <StatCard title="Fee Collected" value={`$${totalFeeCollected.toLocaleString("en-IN")}`} icon={CreditCard} color="bg-emerald-50 text-emerald-600" subtitle="Total payments received" />
        </div>
      </div>

      {/* Financial Summary */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Financial Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">Fees Collected</p>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600">${totalFeeCollected.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">{fees?.length || 0} payment records</p>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">Pending Dues</p>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">${totalPending.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">{pendingInstallments.length} unpaid installments</p>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">Total Income</p>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600">${totalIncome.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">{incomeTransactions.length} income entries</p>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">Total Expense</p>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-destructive">${totalExpense.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">{expenseTransactions.length} expense entries</p>
          </div>
        </div>

        {/* Net Balance */}
        <div className={`mt-4 rounded-2xl p-5 border shadow-sm flex items-center justify-between ${netBalance >= 0 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${netBalance >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Balance (Income − Expense)</p>
              <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-primary" : "text-destructive"}`}>
                {netBalance >= 0 ? "+" : ""}${Math.abs(netBalance).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Income: ${totalIncome.toLocaleString("en-IN")}</p>
            <p>Expense: ${totalExpense.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {/* Income and Expense Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income by Category */}
        {Object.keys(incomeByCategory).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Income by Category</h2>
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
              {Object.entries(incomeByCategory)
                .sort(([, a]: any, [, b]: any) => b - a)
                .map(([cat, amt]: any) => {
                  const maxAmt = Math.max(...Object.values(incomeByCategory) as number[]);
                  const pct = maxAmt > 0 ? (amt / maxAmt) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="w-32 text-sm font-medium text-foreground truncate">{cat}</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-28 text-right text-sm font-semibold text-emerald-600">${amt.toLocaleString("en-IN")}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Expense by Category */}
        {Object.keys(expenseByCategory).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Expense by Category</h2>
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
              {Object.entries(expenseByCategory)
                .sort(([, a]: any, [, b]: any) => b - a)
                .map(([cat, amt]: any) => {
                  const maxAmt = Math.max(...Object.values(expenseByCategory) as number[]);
                  const pct = maxAmt > 0 ? (amt / maxAmt) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="w-32 text-sm font-medium text-foreground truncate">{cat}</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-28 text-right text-sm font-semibold text-destructive">${amt.toLocaleString("en-IN")}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Payment Mode Breakdown */}
        {paymentModes && Object.keys(paymentModes).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Fee Payment Modes</h2>
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
              {Object.entries(paymentModes)
                .sort(([, a]: any, [, b]: any) => b - a)
                .map(([mode, amount]: any) => {
                  const maxAmt = Math.max(...Object.values(paymentModes) as number[]);
                  const pct = maxAmt > 0 ? (amount / maxAmt) * 100 : 0;
                  return (
                    <div key={mode} className="flex items-center gap-3">
                      <div className="w-32 text-sm font-medium text-foreground truncate">{mode}</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-28 text-right text-sm font-semibold text-primary">${amount.toLocaleString("en-IN")}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Course Enrollment Summary */}
        {dashboard?.courseEnrollments && dashboard.courseEnrollments.filter((c: any) => c.studentCount > 0).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Course Enrollment</h2>
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
              {dashboard.courseEnrollments
                .filter((ce: any) => ce.studentCount > 0)
                .map((ce: any) => {
                  const maxCount = Math.max(...dashboard.courseEnrollments.map((c: any) => c.studentCount));
                  const pct = maxCount > 0 ? (ce.studentCount / maxCount) * 100 : 0;
                  return (
                    <div key={ce.courseName} className="flex items-center gap-3">
                      <div className="w-32 text-sm font-medium text-foreground truncate">{ce.courseName}</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-12 text-right text-sm font-semibold text-foreground">{ce.studentCount}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Installment Status Summary */}
      {installments && installments.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Installment Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
              <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Total Installments</p>
              <p className="text-2xl font-bold text-foreground">{installments.length}</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-emerald-200 bg-emerald-50/30 shadow-sm">
              <p className="text-xs text-emerald-700 font-semibold uppercase mb-1">Paid</p>
              <p className="text-2xl font-bold text-emerald-700">{installments.filter((i: any) => i.status === "paid").length}</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-amber-200 bg-amber-50/30 shadow-sm">
              <p className="text-xs text-amber-700 font-semibold uppercase mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-700">{installments.filter((i: any) => i.status === "pending").length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
