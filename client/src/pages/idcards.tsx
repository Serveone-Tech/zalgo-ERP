import { useState } from "react";
import { useStudents } from "@/hooks/use-students";
import { useTeachers } from "@/hooks/use-teachers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IdCard, Printer, Users, GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function IDCardsPage() {
  const { data: students } = useStudents();
  const { data: teachers } = useTeachers();
  const [tab, setTab] = useState<"students" | "teachers">("students");

  const handlePrint = (person: any) => {
    const isStudent = tab === "students";
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ID Card - ${person.name}</title>
      <style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; }
  body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .card { width: 320px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .card-header { background: linear-gradient(135deg, #0f766e, #14b8a6) !important; padding: 16px; color: white; position: relative; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .card-header::before { content: ''; position: absolute; right: -16px; top: -16px; width: 96px; height: 96px; border-radius: 50%; background: rgba(255,255,255,0.1); }
  .card-header .org { font-size: 11px; font-weight: 700; letter-spacing: 2px; opacity: 0.85; }
  .card-header .type { font-size: 11px; opacity: 0.6; margin-top: 2px; }
  .card-body { padding: 16px; }
  .avatar { width: 56px; height: 56px; border-radius: 50%; background: #e0f2f1 !important; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; color: #0f766e; border: 2px solid rgba(15,118,110,0.2); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .info { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .name { font-weight: 700; font-size: 14px; }
  .enroll { font-size: 12px; color: #888; }
  .badge { display: inline-block; background: #f0fdf4 !important; color: #16a34a !important; font-size: 10px; padding: 2px 8px; border-radius: 999px; margin-top: 4px; border: 1px solid #bbf7d0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .details { border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 12px; }
  .detail-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .detail-label { color: #555; font-weight: 500; }
  .detail-value { color: #333; }
  @media print { 
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: white; }
    .card { box-shadow: none; }
    .card-header { background: linear-gradient(135deg, #0f766e, #14b8a6) !important; }
  }
</style>
    </head>
    <body>
      <div class="card">
        <div class="card-header">
          <div class="org">ZALGO EDUTECH</div>
          <div class="type">${isStudent ? "Student" : "Teacher"} ID Card</div>
        </div>
        <div class="card-body">
          <div class="info">
            <div class="avatar">${person.name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="name">${person.name}</div>
              <div class="enroll">${isStudent ? person.enrollmentNo : person.subject}</div>
              <span class="badge">${person.status}</span>
            </div>
          </div>
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">${person.phone}</span>
            </div>
            ${
              isStudent && person.parentName
                ? `
            <div class="detail-row">
              <span class="detail-label">Parent</span>
              <span class="detail-value">${person.parentName}</span>
            </div>`
                : ""
            }
          </div>
        </div>
      </div>
      <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
    </body>
    </html>
  `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          ID Card Generation
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate and print ID cards for students and teachers
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={tab === "students" ? "default" : "outline"}
          onClick={() => setTab("students")}
          className="rounded-xl"
        >
          <Users className="w-4 h-4 mr-2" /> Students
        </Button>
        <Button
          variant={tab === "teachers" ? "default" : "outline"}
          onClick={() => setTab("teachers")}
          className="rounded-xl"
        >
          <GraduationCap className="w-4 h-4 mr-2" /> Teachers
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(tab === "students" ? students : teachers)?.map((person: any) => (
          <div
            key={person.id}
            className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
          >
            {/* Card Design */}
            <div className="bg-gradient-to-br from-primary to-primary/70 p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -right-2 -top-8 w-20 h-20 rounded-full bg-white/5" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/80 relative">
               ZALGO EDUTECH
              </p>
              <p className="text-xs text-white/60 relative">
                {tab === "students" ? "Student" : "Teacher"} ID Card
              </p>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={(person as any).profilePicture || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {person.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">
                    {person.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {tab === "students"
                      ? (person as any).enrollmentNo
                      : (person as any).subject}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-[10px] mt-0.5 px-1.5 py-0.5"
                  >
                    {person.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground border-t border-border/40 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground/70">Phone</span>
                  <span>{person.phone}</span>
                </div>
                {tab === "students" && (person as any).parentName && (
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground/70">
                      Parent
                    </span>
                    <span className="truncate max-w-[100px]">
                      {(person as any).parentName}
                    </span>
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full mt-3 rounded-xl text-xs hover:bg-primary hover:text-white hover:border-primary transition-colors"
                onClick={() => handlePrint(person)}
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Card
              </Button>
            </div>
          </div>
        ))}
      </div>

      {(tab === "students" ? students : teachers)?.length === 0 && (
        <div className="flex flex-col items-center justify-center p-16 bg-card rounded-2xl border border-dashed border-border">
          <IdCard className="w-14 h-14 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground font-medium">No {tab} found</p>
        </div>
      )}
    </div>
  );
}
