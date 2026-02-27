import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, Mail, Users, History } from "lucide-react";
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

export default function CommunicationsPage() {
  const { data: communications, isLoading } = useCommunications();
  const { data: courses } = useCourses();
  const { data: students } = useStudents();
  const [isOpen, setIsOpen] = useState(false);
  const [msgType, setMsgType] = useState<"WhatsApp" | "SMS" | "Email">("WhatsApp");
  const [recipientType, setRecipientType] = useState<"Bulk" | "Student">("Bulk");
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    sendMutation.mutate({
      recipientType: recipientType === "Bulk" ? "Bulk" : "Student",
      recipientId: recipientType === "Student" ? Number(fd.get("studentId")) : undefined,
      courseId: recipientType === "Bulk" ? Number(fd.get("courseId")) : undefined,
      type: msgType,
      subject: msgType === "Email" ? fd.get("subject") : undefined,
      content: fd.get("content"),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Communications</h1>
          <p className="text-muted-foreground text-sm mt-1">Send announcements, alerts & updates to students and parents</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-md shadow-primary/20" data-testid="button-new-message">
              <Send className="w-4 h-4 mr-2" /> New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              {/* Message type */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Channel</Label>
                <div className="flex gap-2">
                  {msgTypes.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMsgType(value as any)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                        msgType === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient type */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Send To</Label>
                <div className="flex gap-2">
                  <Button type="button" variant={recipientType === "Bulk" ? "default" : "outline"} className="flex-1 rounded-xl" onClick={() => setRecipientType("Bulk")}>
                    <Users className="w-4 h-4 mr-2" /> Bulk (Course)
                  </Button>
                  <Button type="button" variant={recipientType === "Student" ? "default" : "outline"} className="flex-1 rounded-xl" onClick={() => setRecipientType("Student")}>
                    Individual
                  </Button>
                </div>
              </div>

              {recipientType === "Bulk" ? (
                <div className="space-y-2">
                  <Label>Select Course/Batch *</Label>
                  <select name="courseId" required className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">All students in course...</option>
                    {courses?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Student *</Label>
                  <select name="studentId" required className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Choose student...</option>
                    {students?.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
                  </select>
                </div>
              )}

              {msgType === "Email" && (
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input name="subject" required className="rounded-xl" placeholder="Email subject" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea name="content" required className="rounded-xl min-h-[120px]" placeholder="Type your announcement or message here..." />
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={sendMutation.isPending}>
                {sendMutation.isPending ? "Sending..." : `Send via ${msgType}`}
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
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${typeInfo?.color || "bg-muted text-muted-foreground"}`}>
                          <Icon className="w-3 h-3" />
                          {c.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{c.recipientType}</Badge>
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
