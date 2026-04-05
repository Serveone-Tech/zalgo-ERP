import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStudents } from "@/hooks/use-students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Printer,
  Plus,
  Trash2,
  FileText,
  Users,
  BookOpen,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) throw new Error("API Error");
  if (res.status === 204) return null;
  return res.json();
}

// ── Report card data hook ─────────────────────────────────────────────────────
function useReportCard(studentId: number | null) {
  return useQuery({
    queryKey: ["/api/report-card", studentId],
    queryFn: () => apiFetch(`/api/report-card/${studentId}`),
    enabled: !!studentId,
    staleTime: 0,
  });
}

export default function ReportCardPage() {
  const { data: students = [] } = useStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );
  const {
    data: reportData,
    isLoading,
    refetch,
  } = useReportCard(selectedStudentId);
  const [activeTab, setActiveTab] = useState("attendance");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["/api/report-card", selectedStudentId],
    });

  // ── ALL MUTATIONS (hooks at top level) ────────────────────────────────────

  // Attendance
  const addAttendanceMut = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/report-card/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, studentId: selectedStudentId }),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Absent record added" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const delAttendanceMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/report-card/attendance/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Record deleted" });
    },
  });

  // Homework
  const addHomeworkMut = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/report-card/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, studentId: selectedStudentId }),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Homework record added" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const delHomeworkMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/report-card/homework/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Record deleted" });
    },
  });

  // Tests
  const addTestMut = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/report-card/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, studentId: selectedStudentId }),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Test result added" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const delTestMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/report-card/tests/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Test deleted" });
    },
  });

  // Remarks
  const addRemarkMut = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/report-card/remarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, studentId: selectedStudentId }),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Remark added" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const delRemarkMut = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/report-card/remarks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Remark deleted" });
    },
  });

  // ── Print handler ─────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!printRef.current || !reportData) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Report Card - ${reportData.student?.name}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
        .page{width:100%;padding:10mm;}
        h1{text-align:center;font-size:18px;font-weight:bold;letter-spacing:3px;margin:8px 0 12px;}
        table{width:100%;border-collapse:collapse;margin:4px 0;}
        th,td{border:1px solid #000;padding:3px 6px;font-size:10px;}
        th{background:#f0f0f0;font-weight:bold;}
        .sec-title{font-weight:bold;font-size:11px;margin:8px 0 2px;}
        .stat{font-size:11px;margin:2px 0;}
        .pie-wrap{display:flex;gap:40px;margin:8px 0;}
        .pie-item{text-align:center;}
        .pie{width:70px;height:70px;border-radius:50%;margin:auto;}
        @media print{body{-webkit-print-color-adjust:exact !important;}}
      </style>
    </head><body><div class="page">
      ${printRef.current.innerHTML}
    </div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
    </body></html>`);
    win.document.close();
  };

  const s = reportData?.student;
  const att = reportData?.attendance;
  const hw = reportData?.homework;
  const tests = reportData?.tests || [];
  const remarks = reportData?.remarks || [];
  const batches = reportData?.batches || [];
  const absentList =
    att?.records?.filter((r: any) => r.status === "absent") || [];
  const hwList = hw?.records || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6" /> Report Card
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Student ka data enter karo aur printable report card generate karo
          </p>
        </div>
        {selectedStudentId && reportData && (
          <Button
            onClick={handlePrint}
            className="rounded-xl gap-2 shadow-md shadow-primary/20"
          >
            <Printer className="w-4 h-4" /> Print Report Card
          </Button>
        )}
      </div>

      {/* Student Selector */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
        <Label className="text-sm font-semibold mb-2 block">
          Student Select Karo *
        </Label>
        <Select
          value={selectedStudentId ? String(selectedStudentId) : ""}
          onValueChange={(v) => {
            setSelectedStudentId(Number(v));
            setActiveTab("attendance");
          }}
        >
          <SelectTrigger className="rounded-xl max-w-md">
            <SelectValue placeholder="Student choose karo..." />
          </SelectTrigger>
          <SelectContent>
            {(students as any[]).map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name} ({s.enrollmentNo})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedStudentId && (
        <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-dashed border-border">
          <FileText className="w-14 h-14 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground font-medium">
            Pehle student select karo
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Phir attendance, homework, test data enter karo
          </p>
        </div>
      )}

      {selectedStudentId && isLoading && (
        <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border">
          Loading...
        </div>
      )}

      {selectedStudentId && reportData && (
        <>
          {/* ── DATA ENTRY TABS ──────────────────────────────────────────────── */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40 bg-muted/30">
              <h2 className="font-semibold text-foreground">Data Entry</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Neeche tabs mein data fill karo — report card automatically
                update hoga
              </p>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="p-5"
            >
              <TabsList className="mb-5">
                <TabsTrigger value="attendance" className="gap-2 text-xs">
                  <Users className="w-3.5 h-3.5" /> Attendance
                  {absentList.length > 0 && (
                    <span className="bg-red-500 text-white text-[9px] rounded-full px-1.5">
                      {absentList.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="homework" className="gap-2 text-xs">
                  <BookOpen className="w-3.5 h-3.5" /> Homework Miss
                  {hwList.length > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] rounded-full px-1.5">
                      {hwList.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="tests" className="gap-2 text-xs">
                  <ClipboardList className="w-3.5 h-3.5" /> Test Results
                  {tests.length > 0 && (
                    <span className="bg-blue-500 text-white text-[9px] rounded-full px-1.5">
                      {tests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="remarks" className="gap-2 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" /> Remarks
                </TabsTrigger>
              </TabsList>

              {/* ── ATTENDANCE TAB ────────────────────────────────────────── */}
              <TabsContent value="attendance" className="space-y-4">
                <AttendanceForm
                  onSubmit={(data) => addAttendanceMut.mutate(data)}
                  isPending={addAttendanceMut.isPending}
                />
                {absentList.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table
                      className="w-full text-sm"
                      style={{ borderCollapse: "collapse" }}
                    >
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-semibold text-xs">
                            #
                          </th>
                          <th className="text-left p-3 font-semibold text-xs">
                            Date
                          </th>
                          <th className="text-left p-3 font-semibold text-xs">
                            Lecture
                          </th>
                          <th className="text-left p-3 font-semibold text-xs">
                            Calling Status
                          </th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {absentList.map((r: any, i: number) => (
                          <tr
                            key={r.id}
                            className="border-t border-border/40 hover:bg-muted/20"
                          >
                            <td className="p-3 text-muted-foreground">
                              {i + 1}
                            </td>
                            <td className="p-3">
                              {r.date
                                ? format(new Date(r.date), "dd MMM yyyy")
                                : "—"}
                            </td>
                            <td className="p-3">{r.lecture || "—"}</td>
                            <td className="p-3">{r.callingStatus || "—"}</td>
                            <td className="p-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => delAttendanceMut.mutate(r.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-xl">
                    Koi absent record nahi hai — upar se add karo
                  </p>
                )}
              </TabsContent>

              {/* ── HOMEWORK TAB ──────────────────────────────────────────── */}
              <TabsContent value="homework" className="space-y-4">
                <HomeworkForm
                  onSubmit={(data) => addHomeworkMut.mutate(data)}
                  isPending={addHomeworkMut.isPending}
                />
                {hwList.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table
                      className="w-full text-sm"
                      style={{ borderCollapse: "collapse" }}
                    >
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-semibold text-xs">
                            #
                          </th>
                          <th className="text-left p-3 font-semibold text-xs">
                            Date
                          </th>
                          <th className="text-left p-3 font-semibold text-xs">
                            Excuse by Student
                          </th>
                          <th className="text-left p-3 font-semibold text-xs">
                            Calling Status
                          </th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {hwList.map((r: any, i: number) => (
                          <tr
                            key={r.id}
                            className="border-t border-border/40 hover:bg-muted/20"
                          >
                            <td className="p-3 text-muted-foreground">
                              {i + 1}
                            </td>
                            <td className="p-3">
                              {r.date
                                ? format(new Date(r.date), "dd MMM yyyy")
                                : "—"}
                            </td>
                            <td className="p-3">{r.excuseByStudent || "—"}</td>
                            <td className="p-3">{r.callingStatus || "—"}</td>
                            <td className="p-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => delHomeworkMut.mutate(r.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-xl">
                    Koi homework miss record nahi — upar se add karo
                  </p>
                )}
              </TabsContent>

              {/* ── TESTS TAB ─────────────────────────────────────────────── */}
              <TabsContent value="tests" className="space-y-4">
                <TestForm
                  onSubmit={(data) => addTestMut.mutate(data)}
                  isPending={addTestMut.isPending}
                />
                {tests.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table
                      className="w-full text-xs"
                      style={{ borderCollapse: "collapse" }}
                    >
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2.5 font-semibold">#</th>
                          <th className="text-left p-2.5 font-semibold">
                            Test Name
                          </th>
                          <th className="text-left p-2.5 font-semibold">
                            Date
                          </th>
                          <th className="text-left p-2.5 font-semibold">
                            Marks
                          </th>
                          <th className="text-left p-2.5 font-semibold">
                            Total
                          </th>
                          <th className="text-left p-2.5 font-semibold">%</th>
                          <th className="text-left p-2.5 font-semibold">
                            Rank
                          </th>
                          <th className="text-left p-2.5 font-semibold">
                            Students
                          </th>
                          <th className="text-left p-2.5 font-semibold">Avg</th>
                          <th className="text-left p-2.5 font-semibold">
                            Highest
                          </th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {tests.map((t: any, i: number) => {
                          const pct = (
                            (t.marksObtained / t.totalMarks) *
                            100
                          ).toFixed(1);
                          return (
                            <tr
                              key={t.id}
                              className="border-t border-border/40 hover:bg-muted/20"
                            >
                              <td className="p-2.5 text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="p-2.5 font-medium">
                                {t.testName}
                              </td>
                              <td className="p-2.5 text-muted-foreground">
                                {t.testDate
                                  ? format(new Date(t.testDate), "dd MMM yy")
                                  : "—"}
                              </td>
                              <td className="p-2.5 font-semibold text-primary">
                                {t.marksObtained}
                              </td>
                              <td className="p-2.5">{t.totalMarks}</td>
                              <td className="p-2.5">{pct}%</td>
                              <td className="p-2.5">{t.rank || "—"}</td>
                              <td className="p-2.5">
                                {t.studentsAppeared || "—"}
                              </td>
                              <td className="p-2.5">{t.averageMarks || "—"}</td>
                              <td className="p-2.5">{t.highestMarks || "—"}</td>
                              <td className="p-2.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => delTestMut.mutate(t.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-xl">
                    Koi test result nahi — upar se add karo
                  </p>
                )}
              </TabsContent>

              {/* ── REMARKS TAB ───────────────────────────────────────────── */}
              <TabsContent value="remarks" className="space-y-4">
                <RemarkForm
                  onSubmit={(data) => addRemarkMut.mutate(data)}
                  isPending={addRemarkMut.isPending}
                />
                {remarks.length > 0 ? (
                  <div className="space-y-2">
                    {remarks.map((r: any, i: number) => (
                      <div
                        key={r.id}
                        className="flex items-start justify-between gap-3 bg-muted/30 rounded-xl px-4 py-3"
                      >
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {r.date
                              ? format(new Date(r.date), "dd MMM yyyy")
                              : "—"}
                          </p>
                          <p className="text-sm font-medium mt-0.5">
                            {r.remark}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => delRemarkMut.mutate(r.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-xl">
                    Koi remark nahi — upar se add karo
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* ── PRINTABLE REPORT CARD PREVIEW ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Report Card Preview</h2>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
            </div>

            <div ref={printRef} className="p-8 font-sans text-black text-xs">
              {/* Title */}
              <h1
                style={{
                  textAlign: "center",
                  fontSize: "18px",
                  fontWeight: "bold",
                  letterSpacing: "3px",
                  borderBottom: "2px solid black",
                  paddingBottom: "8px",
                  marginBottom: "12px",
                }}
              >
                REPORT CARD
              </h1>

              {/* Student Info */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "4px",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                        width: "130px",
                      }}
                    >
                      Name
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        width: "160px",
                      }}
                    >
                      {s?.name}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                        width: "130px",
                      }}
                    >
                      Enrollment No.
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {s?.enrollmentNo}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        textAlign: "center",
                        width: "70px",
                      }}
                      rowSpan={6}
                    >
                      {s?.profilePicture ? (
                        <img
                          src={s.profilePicture}
                          alt="photo"
                          style={{
                            width: "60px",
                            height: "75px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "60px",
                            height: "75px",
                            background: "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                            fontWeight: "bold",
                            color: "#6b7280",
                          }}
                        >
                          {s?.name?.charAt(0)}
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                      }}
                    >
                      Course
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {reportData?.courses?.[0]?.name || "—"}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                      }}
                    >
                      Batch
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {reportData?.courses?.[0]?.name || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                      }}
                    >
                      Parent's Name
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {s?.parentName || "—"}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                      }}
                    >
                      Parent's Phone
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {s?.parentPhone || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                      }}
                    >
                      Self Contact No.
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {s?.phone || "—"}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                      }}
                    >
                      WhatsApp No.
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {s?.parentPhone || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                      }}
                    >
                      Email
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {s?.email || "—"}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                      }}
                    >
                      Address
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {s?.address || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                      }}
                    >
                      Status
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {s?.status || "Active"}
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "3px 6px",
                        fontWeight: "bold",
                        background: "#f9f9f9",
                      }}
                    >
                      Course Interested
                    </td>
                    <td
                      style={{ border: "1px solid black", padding: "3px 6px" }}
                    >
                      {s?.courseInterested || "—"}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Attendance */}
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontWeight: "bold", marginBottom: "3px" }}>
                  &gt;&gt; Total number of class on which student did not attend
                  the class:{" "}
                  <span
                    style={{
                      border: "1px solid black",
                      padding: "1px 10px",
                      marginLeft: "4px",
                    }}
                  >
                    {absentList.length}
                  </span>
                </p>
                <p style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  &gt;&gt; Dates on which student was absent
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                          width: "40px",
                        }}
                      >
                        S.No.
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                        }}
                      >
                        Class (Date)
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                        }}
                      >
                        Lecture
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                        }}
                      >
                        Calling Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {absentList.length > 0 ? (
                      absentList.map((r: any, i: number) => (
                        <tr key={r.id}>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {i + 1}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {r.date
                              ? format(new Date(r.date), "dd MMMM yyyy")
                              : "—"}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {r.lecture || "—"}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {r.callingStatus || "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            border: "1px solid black",
                            padding: "3px 6px",
                            textAlign: "center",
                            color: "#999",
                          }}
                        >
                          No absent records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Homework */}
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontWeight: "bold", marginBottom: "3px" }}>
                  &gt;&gt; Total number of class on which student did not
                  complete homework:{" "}
                  <span
                    style={{
                      border: "1px solid black",
                      padding: "1px 10px",
                      marginLeft: "4px",
                    }}
                  >
                    {hwList.length}
                  </span>
                </p>
                <p style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  &gt;&gt; Dates on which student did not complete homework
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                          width: "40px",
                        }}
                      >
                        S.No.
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                        }}
                      >
                        Excuse by Student
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                        }}
                      >
                        Calling Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hwList.length > 0 ? (
                      hwList.map((r: any, i: number) => (
                        <tr key={r.id}>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {i + 1}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {r.date
                              ? format(new Date(r.date), "dd MMMM yyyy")
                              : "—"}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {r.excuseByStudent || "—"}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {r.callingStatus || "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            border: "1px solid black",
                            padding: "3px 6px",
                            textAlign: "center",
                            color: "#999",
                          }}
                        >
                          No records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Remarks */}
              <div style={{ marginTop: "12px" }}>
                <p style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  &gt;&gt; Additional remark
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                          width: "40px",
                        }}
                      >
                        S.No.
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                          width: "140px",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 6px",
                          textAlign: "left",
                        }}
                      >
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {remarks.length > 0 ? (
                      remarks.map((r: any, i: number) => (
                        <tr key={r.id}>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {i + 1}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {r.date
                              ? format(new Date(r.date), "dd MMMM yyyy")
                              : "—"}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "3px 6px",
                            }}
                          >
                            {r.remark}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            border: "1px solid black",
                            padding: "3px 6px",
                          }}
                        >
                          &nbsp;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Stats */}
              <div style={{ marginTop: "10px" }}>
                <p style={{ marginBottom: "2px" }}>
                  <b>&gt;&gt;</b> Total number of tests organised by institute{" "}
                  <span
                    style={{
                      border: "1px solid black",
                      padding: "1px 10px",
                      marginLeft: "4px",
                    }}
                  >
                    {tests.length}
                  </span>
                </p>
                <p style={{ marginBottom: "2px" }}>
                  <b>&gt;&gt;</b> Total number of tests given by student{" "}
                  <span
                    style={{
                      border: "1px solid black",
                      padding: "1px 10px",
                      marginLeft: "4px",
                    }}
                  >
                    {tests.length}
                  </span>
                </p>
                <p style={{ marginBottom: "2px" }}>
                  <b>&gt;&gt;</b> Batch shifting history —{" "}
                  {batches.length > 0
                    ? batches
                        .map((b: any) => `${b.fromBatch} → ${b.toBatch}`)
                        .join(", ")
                    : "None"}
                </p>
              </div>

              {/* Pie Charts */}
              <div style={{ display: "flex", gap: "60px", marginTop: "12px" }}>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontWeight: "bold",
                      marginBottom: "6px",
                      fontSize: "11px",
                    }}
                  >
                    Attendance
                  </p>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      margin: "0 auto",
                      background: `conic-gradient(#374151 0% ${att?.attendancePercent ?? 0}%, #d1d5db ${att?.attendancePercent ?? 0}% 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "11px",
                    }}
                  >
                    {att?.attendancePercent ?? 0}%
                  </div>
                  <p style={{ fontSize: "10px", marginTop: "4px" }}>
                    ● Present &nbsp; ○ Absent
                  </p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontWeight: "bold",
                      marginBottom: "6px",
                      fontSize: "11px",
                    }}
                  >
                    Homework Completion Status
                  </p>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      margin: "0 auto",
                      background: `conic-gradient(#374151 0% ${hw?.hwPercent ?? 0}%, #d1d5db ${hw?.hwPercent ?? 0}% 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "11px",
                    }}
                  >
                    {hw?.hwPercent ?? 0}%
                  </div>
                  <p style={{ fontSize: "10px", marginTop: "4px" }}>
                    ● Complete &nbsp; ○ Incomplete
                  </p>
                </div>
              </div>

              {/* Test Results */}
              <div style={{ marginTop: "16px" }}>
                <p
                  style={{
                    fontWeight: "bold",
                    fontSize: "12px",
                    marginBottom: "6px",
                  }}
                >
                  Subjective Test Performance
                </p>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "10px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f0f0f0" }}>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 4px",
                          textAlign: "left",
                        }}
                      >
                        S.No.
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 4px",
                          textAlign: "left",
                        }}
                      >
                        Test Name
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 4px",
                          textAlign: "left",
                        }}
                      >
                        Marks Obtained
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 4px",
                          textAlign: "left",
                        }}
                      >
                        Total Marks
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 4px",
                          textAlign: "left",
                        }}
                      >
                        Percentage
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 4px",
                          textAlign: "left",
                        }}
                      >
                        Rank
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 4px",
                          textAlign: "left",
                        }}
                      >
                        No. of Students Appeared
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 4px",
                          textAlign: "left",
                        }}
                      >
                        Average Marks
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 4px",
                          textAlign: "left",
                        }}
                      >
                        Highest Marks
                      </th>
                      <th
                        style={{
                          border: "1px solid black",
                          padding: "3px 4px",
                          textAlign: "left",
                        }}
                      >
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.length > 0 ? (
                      tests.map((t: any, i: number) => {
                        const pct = (
                          (t.marksObtained / t.totalMarks) *
                          100
                        ).toFixed(2);
                        return (
                          <tr key={t.id}>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "3px 4px",
                              }}
                            >
                              {i + 1}
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "3px 4px",
                              }}
                            >
                              {t.testName},{" "}
                              {t.testDate
                                ? format(new Date(t.testDate), "dd-MMMM-yyyy")
                                : ""}
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "3px 4px",
                              }}
                            >
                              {t.marksObtained}
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "3px 4px",
                              }}
                            >
                              {t.totalMarks}
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "3px 4px",
                              }}
                            >
                              {pct}%
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "3px 4px",
                              }}
                            >
                              {t.rank || "—"}
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "3px 4px",
                              }}
                            >
                              {t.studentsAppeared || "—"}
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "3px 4px",
                              }}
                            >
                              {t.averageMarks || "—"}
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "3px 4px",
                              }}
                            >
                              {t.highestMarks || "—"}
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "3px 4px",
                              }}
                            >
                              {t.remark || ""}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={10}
                          style={{
                            border: "1px solid black",
                            padding: "6px",
                            textAlign: "center",
                            color: "#999",
                          }}
                        >
                          No test results
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Form Components ────────────────────────────────────────────────────────────

function AttendanceForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (d: any) => void;
  isPending: boolean;
}) {
  const [date, setDate] = useState("");
  const [lecture, setLecture] = useState("");
  const [callingStatus, setCallingStatus] = useState("Informed by us");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    onSubmit({ date, lecture, status: "absent", callingStatus });
    setDate("");
    setLecture("");
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-red-800 mb-3">
        + Absent Record Add Karo
      </p>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div className="space-y-1">
          <Label className="text-xs">Date *</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Lecture</Label>
          <Input
            value={lecture}
            onChange={(e) => setLecture(e.target.value)}
            placeholder="PCM, Physics..."
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Calling Status</Label>
          <select
            value={callingStatus}
            onChange={(e) => setCallingStatus(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-2 py-1 h-8 text-sm"
          >
            <option>Informed by us</option>
            <option>Not informed</option>
            <option>N/A</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="w-full rounded-lg"
          >
            {isPending ? "Adding..." : "Add Record"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function HomeworkForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (d: any) => void;
  isPending: boolean;
}) {
  const [date, setDate] = useState("");
  const [excuse, setExcuse] = useState("Forgot to complete");
  const [callingStatus, setCallingStatus] = useState("Other");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    onSubmit({ date, excuseByStudent: excuse, callingStatus });
    setDate("");
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-amber-800 mb-3">
        + Homework Miss Record Add Karo
      </p>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div className="space-y-1">
          <Label className="text-xs">Date *</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Excuse by Student</Label>
          <select
            value={excuse}
            onChange={(e) => setExcuse(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-2 py-1 h-8 text-sm"
          >
            <option>Forgot to complete</option>
            <option>Was sick</option>
            <option>Didn't understand</option>
            <option value="0">0</option>
            <option>Other</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Calling Status</Label>
          <select
            value={callingStatus}
            onChange={(e) => setCallingStatus(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-2 py-1 h-8 text-sm"
          >
            <option>Other</option>
            <option>Informed by us</option>
            <option>N/A</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="w-full rounded-lg"
          >
            {isPending ? "Adding..." : "Add Record"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function TestForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (d: any) => void;
  isPending: boolean;
}) {
  const empty = {
    testName: "",
    testDate: "",
    marksObtained: "",
    totalMarks: "",
    rank: "",
    studentsAppeared: "",
    averageMarks: "",
    highestMarks: "",
    remark: "",
  };
  const [form, setForm] = useState(empty);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      marksObtained: Number(form.marksObtained),
      totalMarks: Number(form.totalMarks),
      rank: form.rank ? Number(form.rank) : null,
      studentsAppeared: form.studentsAppeared
        ? Number(form.studentsAppeared)
        : null,
      highestMarks: form.highestMarks ? Number(form.highestMarks) : null,
      averageMarks: form.averageMarks || null,
    });
    setForm(empty);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-blue-800 mb-3">
        + Test Result Add Karo
      </p>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
      >
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Test Name *</Label>
          <Input
            value={form.testName}
            onChange={set("testName")}
            placeholder="PHYSICS SUBJECTIVE-1"
            required
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Test Date *</Label>
          <Input
            type="date"
            value={form.testDate}
            onChange={set("testDate")}
            required
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Marks Obtained *</Label>
          <Input
            type="number"
            value={form.marksObtained}
            onChange={set("marksObtained")}
            required
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Total Marks *</Label>
          <Input
            type="number"
            value={form.totalMarks}
            onChange={set("totalMarks")}
            required
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Rank</Label>
          <Input
            type="number"
            value={form.rank}
            onChange={set("rank")}
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Students Appeared</Label>
          <Input
            type="number"
            value={form.studentsAppeared}
            onChange={set("studentsAppeared")}
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Average Marks</Label>
          <Input
            value={form.averageMarks}
            onChange={set("averageMarks")}
            placeholder="45.38"
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Highest Marks</Label>
          <Input
            type="number"
            value={form.highestMarks}
            onChange={set("highestMarks")}
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Remark</Label>
          <Input
            value={form.remark}
            onChange={set("remark")}
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="w-full rounded-lg"
          >
            {isPending ? "Adding..." : "Add Test"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function RemarkForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (d: any) => void;
  isPending: boolean;
}) {
  const [date, setDate] = useState("");
  const [remark, setRemark] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !remark) return;
    onSubmit({ date, remark });
    setDate("");
    setRemark("");
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-purple-800 mb-3">
        + Remark Add Karo
      </p>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <div className="space-y-1">
          <Label className="text-xs">Date *</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Remark *</Label>
          <Input
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            required
            placeholder="Remark likhein..."
            className="rounded-lg h-8 text-sm"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="w-full rounded-lg"
          >
            {isPending ? "Adding..." : "Add Remark"}
          </Button>
        </div>
      </form>
    </div>
  );
}
