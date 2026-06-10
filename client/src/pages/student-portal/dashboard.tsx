import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useCurrency } from "@/hooks/use-currency";
import { CalendarCheck, ClipboardList, CreditCard, Video, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardData {
  student: { name: string; enrollmentNo: string; email: string; phone: string; status: string; courseInterested: string | null };
  stats: { attendancePct: number | null; totalClasses: number; presentClasses: number; totalExams: number; totalFeePaid: number; liveNow: number };
}

export default function StudentDashboard() {
  const { fmt } = useCurrency();
  const [, navigate] = useLocation();
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ["/api/student-portal/dashboard"] });

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!data) return null;
  const { student, stats } = data;

  const statCards = [
    { label: "Attendance", value: stats.attendancePct !== null ? `${stats.attendancePct}%` : "N/A", sub: `${stats.presentClasses}/${stats.totalClasses} classes`, icon: CalendarCheck, color: "text-green-600", bg: "bg-green-50", href: "/student/attendance" },
    { label: "Exams", value: String(stats.totalExams), sub: "Total tests", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50", href: "/student/exams" },
    { label: "Fee Paid", value: fmt(stats.totalFeePaid), sub: "Total payments", icon: CreditCard, color: "text-violet-600", bg: "bg-violet-50", href: "/student/fees" },
    { label: "Live Classes", value: stats.liveNow > 0 ? `${stats.liveNow} Live` : "0", sub: stats.liveNow > 0 ? "Class in progress!" : "No live class", icon: Video, color: stats.liveNow > 0 ? "text-red-600" : "text-muted-foreground", bg: stats.liveNow > 0 ? "bg-red-50" : "bg-muted/30", href: "/student/live-classes" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-5">
        <p className="text-sm opacity-80">Welcome back,</p>
        <h1 className="text-xl font-bold mt-0.5">{student.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs opacity-70">#{student.enrollmentNo}</span>
          <Badge className="bg-white/20 text-white border-0 text-xs">{student.status}</Badge>
        </div>
      </div>

      {stats.liveNow > 0 && (
        <button onClick={() => navigate("/student/live-classes")} className="w-full flex items-center gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-left hover:bg-red-100 transition-colors">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-700">Live Class in Progress!</p>
            <p className="text-sm text-red-600">Your class is live now — tap to join</p>
          </div>
          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">Join</Button>
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <button key={card.label} onClick={() => navigate(card.href)} className="rounded-xl border bg-card p-4 text-left hover:shadow-sm transition-shadow">
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{card.sub}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold text-sm">My Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {[
            { label: "Email", value: student.email || "—" },
            { label: "Phone", value: student.phone },
            { label: "Course", value: student.courseInterested || "—" },
            { label: "Status", value: student.status },
          ].map((row) => (
            <div key={row.label} className="flex justify-between py-1.5 border-b last:border-0 sm:border-0">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium text-right">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
