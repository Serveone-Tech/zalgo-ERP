import { useState } from "react";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useAuth } from "@/contexts/auth";
import { useBranch } from "@/contexts/branch";
import {
  Users, UserSquare2, GraduationCap, CreditCard, AlertCircle, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const PERIODS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "15 Days", value: "15days" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [period, setPeriod] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const activePeriod = showCustom ? "custom" : period;
  const { data: stats, isLoading } = useDashboardStats(
    activePeriod || undefined,
    showCustom ? customFrom : undefined,
    showCustom ? customTo : undefined
  );

  const handlePeriodClick = (p: string) => {
    setShowCustom(false);
    setPeriod(p);
  };

  const statCards = [
    { title: "Total Students", value: stats?.totalStudents ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Enquiries", value: stats?.activeLeads ?? 0, icon: UserSquare2, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Total Teachers", value: stats?.totalTeachers ?? 0, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Revenue Collected", value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: CreditCard, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Pending Fees", value: `₹${(stats?.pendingFees ?? 0).toLocaleString('en-IN')}`, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {user?.name}. {selectedBranch ? `Viewing: ${selectedBranch.name}` : "All Branches"}
          </p>
        </div>
        {/* Date Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          {PERIODS.map(p => (
            <Button
              key={p.value}
              variant={activePeriod === p.value && !showCustom ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => handlePeriodClick(p.value)}
              data-testid={`button-period-${p.value || "all"}`}
            >
              {p.label}
            </Button>
          ))}
          <Button
            variant={showCustom ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => { setShowCustom(true); setPeriod("custom"); }}
            data-testid="button-period-custom"
          >
            <Calendar className="w-3 h-3" /> Custom
          </Button>
        </div>
      </div>

      {/* Custom date range */}
      {showCustom && (
        <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/40 rounded-xl border border-border/60">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-8 text-sm w-36" data-testid="input-date-from" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="h-8 text-sm w-36" data-testid="input-date-to" />
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border shadow-sm hover:shadow-md transition-all rounded-2xl group">
            <CardContent className="p-5">
              {isLoading ? (
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              )}
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
                  <div key={i} className="p-4 flex justify-between"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-16" /></div>
                ))
              ) : stats?.courseEnrollments?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No enrollment data</div>
              ) : (
                stats?.courseEnrollments?.map((course, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <span className="font-medium text-sm text-foreground">{course.courseName}</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">{course.studentCount} Students</Badge>
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
                  <div key={i} className="p-4"><Skeleton className="h-4 w-full" /></div>
                ))
              ) : stats?.recentLeads?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No recent enquiries</div>
              ) : (
                stats?.recentLeads?.map((lead: any) => (
                  <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-foreground">{lead.studentName}</p>
                      <p className="text-xs text-muted-foreground">{lead.courseInterested} &bull; {lead.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={lead.status === "New" ? "default" : "secondary"} className="text-xs">
                        {lead.status}
                      </Badge>
                      {lead.createdAt && (
                        <span className="text-xs text-muted-foreground">{format(new Date(lead.createdAt), 'MMM d')}</span>
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
