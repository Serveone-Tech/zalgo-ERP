import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ClipboardList, Loader2, Trophy, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TestResult { id: number; testName: string; testDate: string; marksObtained: number; totalMarks: number; rank: number | null; studentsAppeared: number | null; averageMarks: number | null; highestMarks: number | null; remark: string | null }

export default function StudentExamsPage() {
  const { data: results = [], isLoading } = useQuery<TestResult[]>({ queryKey: ["/api/student-portal/exams"] });
  const avgPct = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.marksObtained / r.totalMarks) * 100, 0) / results.length) : null;
  const best = results.length > 0 ? results.reduce((a, b) => a.marksObtained / a.totalMarks > b.marksObtained / b.totalMarks ? a : b) : null;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" />Exams & Results</h1>
      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4"><TrendingUp className="w-4 h-4 text-blue-500 mb-2" /><p className="text-2xl font-bold">{avgPct}%</p><p className="text-xs text-muted-foreground mt-0.5">Average Score</p></div>
          {best && <div className="rounded-xl border bg-card p-4"><Trophy className="w-4 h-4 text-amber-500 mb-2" /><p className="text-2xl font-bold">{Math.round((best.marksObtained / best.totalMarks) * 100)}%</p><p className="text-xs text-muted-foreground mt-0.5">Best Score</p></div>}
        </div>
      )}
      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        : results.length === 0 ? <div className="text-center py-12 text-muted-foreground text-sm">No exam results yet</div>
        : (
          <div className="space-y-3">
            {results.map(r => {
              const pct = Math.round((r.marksObtained / r.totalMarks) * 100);
              const barColor = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500";
              return (
                <div key={r.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold">{r.testName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(r.testDate), "dd MMM yyyy")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg">{r.marksObtained}/{r.totalMarks}</p>
                      <Badge variant="outline" className={pct >= 75 ? "border-green-300 text-green-700 bg-green-50" : pct >= 50 ? "border-amber-300 text-amber-700 bg-amber-50" : "border-red-300 text-red-700 bg-red-50"}>{pct}%</Badge>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} /></div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {r.rank && <span>Rank: #{r.rank}{r.studentsAppeared ? ` / ${r.studentsAppeared}` : ""}</span>}
                    {r.averageMarks && <span>Avg: {r.averageMarks}</span>}
                    {r.highestMarks && <span>Highest: {r.highestMarks}</span>}
                  </div>
                  {r.remark && <p className="text-xs text-muted-foreground mt-1 italic">"{r.remark}"</p>}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
