import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, Mail, Users, History, User, UserCheck } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCourses } from "@/hooks/use-courses";
import { useStudents } from "@/hooks/use-students";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function useCommunications() {
  return useQuery({
    queryKey: ["/api/communications"],
    queryFn: async () => {
      const res = await fetch("/api/communications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}

const msgTypes = [
  { value: "WhatsApp", label: "WhatsApp", icon: SiWhatsapp, color: "text-green-600 bg-green-50" },
  { value: "SMS", label: "SMS", icon: MessageSquare, color: "text-blue-600 bg-blue-50" },
  { value: "Email", label: "Email", icon: Mail, color: "text-purple-600 bg-purple-50" },
];

type SendMode = "Bulk" | "Student" | "Parent";

export default function CommunicationsPage() {
  const { data: communications, isLoading } = useCommunications();
  const { data: courses } = useCourses();
  const { data: students } = useStudents();
  const [isOpen, setIsOpen] = useState(false);
  const [msgType, setMsgType] = useState<"WhatsApp" | "SMS" | "Email">("WhatsApp");
  const [sendMode, setSendMode] = useState<SendMode>("Bulk");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const selectedStudent = students?.find((s: any) => String(s.id) === selectedStudentId);

  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/communications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({ title: "Message sent successfully!" });
      setIsOpen(false);
      setSelectedStudentId("");
      setSendMode("Bulk");
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (sendMode === "Bulk") {
      sendMutation.mutate({
        recipientType: "Bulk",
        courseId: Number(fd.get("courseId")),
        type: msgType,
        subject: msgType === "Email" ? fd.get("subject") : undefined,
        content: fd.get("content"),
      });
    } else {
      sendMutation.mutate({
        recipientType: sendMode,
        recipientId: Number(selectedStudentId),
        type: msgType,
        subject: msgType === "Email" ? fd.get("subject") : undefined,
        content: fd.get("content"),
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Communications</h1>
          <p className="text-muted-foreground text-sm mt-1">Send announcements, alerts & updates to students and parents</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setSelectedStudentId(""); setSendMode("Bulk"); } }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-md shadow-primary/20" data-testid="button-new-message">
              <Send className="w-4 h-4 mr-2" /> New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">

              {/* Channel */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Channel</Label>
                <div className="flex gap-2">
                  {msgTypes.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMsgType(value as any)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                        msgType === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                      data-testid={`channel-${value.toLowerCase()}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Send Mode */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Send To</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setSendMode("Bulk"); setSelectedStudentId(""); }}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                      sendMode === "Bulk" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                    data-testid="mode-bulk"
                  >
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium">Bulk (Course)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendMode("Student")}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                      sendMode === "Student" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                    data-testid="mode-student"
                  >
                    <User className="w-5 h-5 text-blue-500" />
                    <span className="text-xs font-medium">Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendMode("Parent")}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                      sendMode === "Parent" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                    data-testid="mode-parent"
                  >
                    <UserCheck className="w-5 h-5 text-orange-500" />
                    <span className="text-xs font-medium">Parent</span>
                  </button>
                </div>
              </div>

              {/* Bulk: Course select */}
              {sendMode === "Bulk" && (
                <div className="space-y-2">
                  <Label>Select Course/Batch *</Label>
                  <select name="courseId" required className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" data-testid="select-course">
                    <option value="">All students in course...</option>
                    {courses?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Student / Parent: Student select */}
              {(sendMode === "Student" || sendMode === "Parent") && (
                <div className="space-y-2">
                  <Label>Select Student *</Label>
                  <select
                    required
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="select-student"
                  >
                    <option value="">Choose student...</option>
                    {students?.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
                  </select>

                  {/* Show parent info when Parent mode selected */}
                  {sendMode === "Parent" && selectedStudent && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200">
                      <UserCheck className="w-4 h-4 text-orange-500 shrink-0" />
                      <div className="text-xs">
                        <span className="font-semibold text-orange-700">{selectedStudent.parentName || "Parent"}</span>
                        <span className="text-orange-600 ml-2">{selectedStudent.parentPhone || "No parent phone"}</span>
                      </div>
                    </div>
                  )}

                  {sendMode === "Parent" && selectedStudent && !selectedStudent.parentPhone && (
                    <p className="text-xs text-destructive">This student has no parent phone number saved.</p>
                  )}
                </div>
              )}

              {/* Email subject */}
              {msgType === "Email" && (
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input name="subject" required className="rounded-xl" placeholder="Email subject" data-testid="input-subject" />
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea name="content" required className="rounded-xl min-h-[120px]" placeholder="Type your message here..." data-testid="input-message" />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={sendMutation.isPending || (sendMode === "Parent" && selectedStudent && !selectedStudent.parentPhone)}
                data-testid="button-send"
              >
                {sendMutation.isPending ? "Sending..." : `Send via ${msgType} to ${sendMode === "Bulk" ? "Course" : sendMode}`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* History */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-border/40">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Message History</h3>
          <Badge variant="secondary" className="ml-auto">{communications?.length || 0} sent</Badge>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : communications?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">No messages sent yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Channel</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...communications].reverse().map((c: any) => {
                  const typeInfo = msgTypes.find(t => t.value === c.type);
                  const Icon = typeInfo?.icon || MessageSquare;
                  const recipientColor =
                    c.recipientType === "Parent" ? "bg-orange-50 text-orange-700 border-orange-200" :
                    c.recipientType === "Student" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-muted text-muted-foreground";
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${typeInfo?.color || "bg-muted text-muted-foreground"}`}>
                          <Icon className="w-3 h-3" />
                          {c.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${recipientColor}`}>
                          {c.recipientType === "Parent" && <UserCheck className="w-3 h-3 mr-1" />}
                          {c.recipientType === "Student" && <User className="w-3 h-3 mr-1" />}
                          {c.recipientType === "Bulk" && <Users className="w-3 h-3 mr-1" />}
                          {c.recipientType}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.content}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {c.sentAt ? new Date(c.sentAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
