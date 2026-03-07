import { useState } from "react";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useAuth } from "@/contexts/auth";
import { useBranch } from "@/contexts/branch";
import { useLocation } from "wouter";
import {
  Users, UserSquare2, GraduationCap, CreditCard, AlertCircle, ArrowRight, TrendingUp, TrendingDown, IndianRupee
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DateFilter, DateFilterValue, filterToNavQuery, buildApiParams } from "@/components/date-filter";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<DateFilterValue>({ period: "", from: "", to: "" });

  const params: Record<string, string> = {};
  if (filter.period && filter.period !== "all") {
    params.period = filter.period;
    if (filter.period === "custom") {
      if (filter.from) params.from = filter.from;
      if (filter.to) params.to = filter.to;
    }
  }

  const { data: stats, isLoading } = useDashboardStats(
    params.period || undefined,
    params.from || undefined,
    params.to || undefined,
  );

  const navWithFilter = (path: string) => {
    const qs = filterToNavQuery(filter);
    navigate(`${path}${qs}`);
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      path: "/students",
      testid: "card-total-students",
    },
    {
      title: "Active Enquiries",
      value: stats?.activeLeads ?? 0,
      icon: UserSquare2,
      color: "text-amber-600",
      bg: "bg-amber-50",
      path: "/leads",
      testid: "card-active-leads",
    },
    {
      title: "Total Teachers",
      value: stats?.totalTeachers ?? 0,
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      path: "/teachers",
      testid: "card-total-teachers",
    },
    {
      title: "Fees Collected",
      value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`,
      icon: CreditCard,
      color: "text-purple-600",
      bg: "bg-purple-50",
      path: "/fees",
      testid: "card-fees-collected",
    },
    {
      title: "Pending Fees",
      value: `₹${(stats?.pendingFees ?? 0).toLocaleString("en-IN")}`,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      path: "/fees",
      testid: "card-pending-fees",
    },
    {
      title: "Total Income",
      value: `₹${(stats?.totalIncome ?? 0).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      path: "/transactions",
      testid: "card-total-income",
    },
    {
      title: "Total Expense",
      value: `₹${(stats?.totalExpense ?? 0).toLocaleString("en-IN")}`,
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
      path: "/transactions",
      testid: "card-total-expense",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {user?.name}. {selectedBranch ? `Viewing: ${selectedBranch.name}` : "All Branches"}
          </p>
        </div>
        <DateFilter value={filter} onChange={setFilter} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.testid}
            className="border shadow-sm hover:shadow-md transition-all rounded-2xl group cursor-pointer hover:border-primary/30 active:scale-[0.98]"
            onClick={() => navWithFilter(stat.path)}
            data-testid={stat.testid}
          >
            <CardContent className="p-5">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1 tracking-tight truncate">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform shrink-0 ml-2`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Enrollments + Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <CardTitle className="text-base font-semibold">Course Enrollment Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 flex justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
              ) : stats?.courseEnrollments?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No enrollment data</div>
              ) : (
                stats?.courseEnrollments?.map((course, idx) => (
                  <div
                    key={idx}
                    className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => navigate("/courses")}
                  >
                    <span className="font-medium text-sm text-foreground">{course.courseName}</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {course.studentCount} Students
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <CardTitle className="text-base font-semibold">Recent Enquiries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : stats?.recentLeads?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No recent enquiries</div>
              ) : (
                stats?.recentLeads?.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <div>
                      <p className="font-medium text-sm text-foreground">{lead.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.courseInterested} &bull; {lead.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={lead.status === "New" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {lead.status}
                      </Badge>
                      {lead.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(lead.createdAt), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
