import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, TrendingUp, BookOpen, CreditCard, GraduationCap, UserSquare2 } from "lucide-react";
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

  const activeStudents = students?.filter((s: any) => s.status === "Active").length || 0;
  const totalFeeCollected = fees?.reduce((s: number, f: any) => s + f.amountPaid, 0) || 0;
  const totalIncome = transactions?.filter((t: any) => t.type === "Income").reduce((s: number, t: any) => s + t.amount, 0) || 0;
  const totalExpense = transactions?.filter((t: any) => t.type === "Expense").reduce((s: number, t: any) => s + t.amount, 0) || 0;

  const paymentModes = fees?.reduce((acc: any, f: any) => {
    acc[f.paymentMode] = (acc[f.paymentMode] || 0) + f.amountPaid;
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
          <StatCard title="Total Students" value={dashboard?.totalStudents || 0} icon={Users} color="bg-primary/10 text-primary" subtitle={`${activeStudents} active`} />
          <StatCard title="Active Leads" value={dashboard?.activeLeads || 0} icon={UserSquare2} color="bg-amber-50 text-amber-600" subtitle="Pending follow-up" />
          <StatCard title="Total Teachers" value={dashboard?.totalTeachers || 0} icon={GraduationCap} color="bg-purple-50 text-purple-600" />
          <StatCard title="Total Revenue" value={`₹${(dashboard?.totalRevenue || 0).toLocaleString("en-IN")}`} icon={CreditCard} color="bg-emerald-50 text-emerald-600" subtitle="Fee collection" />
        </div>
      </div>

      {/* Financial Summary */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Financial Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium mb-2">Fee Collected</p>
            <p className="text-2xl font-bold text-emerald-600">₹{totalFeeCollected.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">{fees?.length || 0} payment records</p>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium mb-2">Total Income</p>
            <p className="text-2xl font-bold text-emerald-600">₹{totalIncome.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">From all income transactions</p>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
            <p className="text-sm text-muted-foreground font-medium mb-2">Total Expense</p>
            <p className="text-2xl font-bold text-destructive">₹{totalExpense.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground mt-1">From all expense transactions</p>
          </div>
        </div>
      </div>

      {/* Payment Mode Breakdown */}
      {paymentModes && Object.keys(paymentModes).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Fee Payment Modes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(paymentModes).map(([mode, amount]: any) => (
              <div key={mode} className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                <p className="text-sm font-semibold text-foreground">{mode}</p>
                <p className="text-xl font-bold text-primary mt-1">₹{amount.toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Enrollment */}
      {dashboard?.courseEnrollments && dashboard.courseEnrollments.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Course Enrollment Summary</h2>
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
            {dashboard.courseEnrollments.map((ce: any) => {
              const maxCount = Math.max(...(dashboard.courseEnrollments ?? []).map((c: any) => c.studentCount));
              const pct = maxCount > 0 ? (ce.studentCount / maxCount) * 100 : 0;
              return (
                <div key={ce.courseName} className="flex items-center gap-4">
                  <div className="w-36 text-sm font-medium text-foreground truncate">{ce.courseName}</div>
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
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
  );
}
