import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarCheck, Loader2, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AttendanceRecord { id: number; date: string; lecture: string | null; status: string; remark: string | null }

export default function StudentAttendancePage() {
  const { data: records = [], isLoading } = useQuery<AttendanceRecord[]>({ queryKey: ["/api/student-portal/attendance"] });
  const total = records.length;
  const present = records.filter(r => r.status === "Present").length;
  const absent = records.filter(r => r.status === "Absent").length;
  const pct = total > 0 ? Math.round((present / total) * 100) : null;
  const pctColor = pct === null ? "text-muted-foreground" : pct >= 75 ? "text-green-600" : pct >= 50 ? "text-amber-500" : "text-red-500";

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-primary" />Attendance</h1>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Total", value: total, color: "text-foreground" }, { label: "Present", value: present, color: "text-green-600" }, { label: "Absent", value: absent, color: "text-red-500" }].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Attendance Percentage</span>
            <span className={`text-lg font-bold ${pctColor}`}>{pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct! >= 75 ? "bg-green-500" : pct! >= 50 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
          </div>
          {pct !== null && pct < 75 && <p className="text-xs text-amber-600 mt-2">Minimum 75% attendance required</p>}
        </div>
      )}
      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        : records.length === 0 ? <div className="text-center py-12 text-muted-foreground text-sm">No attendance records yet</div>
        : (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Records</h2>
            {records.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
                {r.status === "Present" ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : r.status === "Absent" ? <XCircle className="w-5 h-5 text-red-500 shrink-0" /> : <MinusCircle className="w-5 h-5 text-muted-foreground shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">{format(new Date(r.date), "dd MMM yyyy, EEEE")}</p>
                  {r.lecture && <p className="text-xs text-muted-foreground">{r.lecture}</p>}
                  {r.remark && <p className="text-xs text-muted-foreground italic">{r.remark}</p>}
                </div>
                <Badge variant={r.status === "Present" ? "outline" : "secondary"} className={r.status === "Present" ? "border-green-300 text-green-700 bg-green-50" : r.status === "Absent" ? "border-red-300 text-red-700 bg-red-50" : ""}>{r.status}</Badge>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
