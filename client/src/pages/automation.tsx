// client/src/pages/automation.tsx  — NEW FILE
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Zap,
  Send,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";

function useEventTypes() {
  return useQuery({
    queryKey: ["/api/automation/event-types"],
    queryFn: async () => {
      const res = await fetch("/api/automation/event-types", { credentials: "include" });
      return res.json();
    },
  });
}

function useKlaviyoLists() {
  return useQuery({
    queryKey: ["/api/automation/lists"],
    queryFn: async () => {
      const res = await fetch("/api/automation/lists", { credentials: "include" });
      return res.json();
    },
  });
}

function useStats() {
  return useQuery({
    queryKey: ["/api/automation/stats"],
    queryFn: async () => {
      const res = await fetch("/api/automation/stats", { credentials: "include" });
      return res.json();
    },
  });
}

const AUDIENCE_OPTIONS = [
  { value: "all_students", label: "All Students", icon: Users },
  { value: "all_leads", label: "All Leads / Enquiries", icon: Users },
  { value: "expiring_soon", label: "Expiring Subscriptions (≤7 days)", icon: Clock },
  { value: "custom_list", label: "Custom Klaviyo List", icon: Zap },
];

export default function AutomationPage() {
  const { toast } = useToast();
  const { data: eventTypes = [] } = useEventTypes();
  const { data: lists = [] } = useKlaviyoLists();
  const { data: stats } = useStats();

  const [form, setForm] = useState({
    eventName: "",
    audience: "all_students",
    listId: "",
    note: "",
  });

  const sendMut = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/automation/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: `Campaign sent to ${data.sent} profiles` });
    },
    onError: (err: any) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const handleSend = () => {
    if (!form.eventName) {
      toast({ title: "Please select an event type", variant: "destructive" });
      return;
    }
    sendMut.mutate({
      eventName: form.eventName,
      audience: form.audience,
      listId: form.listId || undefined,
      properties: form.note ? { note: form.note } : undefined,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Send automated messages via Klaviyo to students, leads, and users
          </p>
        </div>
        <a
          href="https://www.klaviyo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Open Klaviyo
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Klaviyo connection status */}
      {stats && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${stats.configured ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400" : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"}`}>
          {stats.configured ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          {stats.message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Send Campaign */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="w-4 h-4 text-primary" />
              Send Campaign
            </CardTitle>
            <CardDescription>
              Trigger a Klaviyo event to an audience segment. Klaviyo flows handle the actual message delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Event Type</Label>
              <Select
                value={form.eventName}
                onValueChange={(v) => setForm((f) => ({ ...f, eventName: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event..." />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((et: any) => (
                    <SelectItem key={et.key} value={et.label}>
                      {et.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Audience</Label>
              <Select
                value={form.audience}
                onValueChange={(v) => setForm((f) => ({ ...f, audience: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.audience === "custom_list" && (
              <div className="space-y-1.5">
                <Label className="text-sm">Klaviyo List</Label>
                <Select
                  value={form.listId}
                  onValueChange={(v) => setForm((f) => ({ ...f, listId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.length === 0 ? (
                      <SelectItem value="_none" disabled>No lists found — check Klaviyo API key</SelectItem>
                    ) : (
                      lists.map((l: any) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm">Additional Note (optional)</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Extra message or context to pass with the event properties..."
                rows={3}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={sendMut.isPending || !form.eventName}
              className="w-full"
            >
              {sendMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Campaign
            </Button>
          </CardContent>
        </Card>

        {/* Automation Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-primary" />
              Automation Events
            </CardTitle>
            <CardDescription>
              These events are automatically triggered by the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { event: "User Registered", trigger: "When a new user signs up", badge: "Auto" },
              { event: "Plan Activated", trigger: "When a user subscribes to a plan", badge: "Auto" },
              { event: "Plan Expiring Soon", trigger: "7 days before subscription ends", badge: "Auto" },
              { event: "Plan Expired", trigger: "When subscription expires", badge: "Auto" },
              { event: "Fee Due", trigger: "When a fee installment is due", badge: "Auto" },
              { event: "Fee Paid", trigger: "When a payment is recorded", badge: "Auto" },
              { event: "Student Enrolled", trigger: "When a student is enrolled in a course", badge: "Auto" },
            ].map((item) => (
              <div key={item.event} className="flex items-start justify-between gap-3 py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.event}</p>
                  <p className="text-xs text-muted-foreground">{item.trigger}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">{item.badge}</Badge>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2">
              Set up flows in Klaviyo to respond to these events with emails, SMS, or WhatsApp messages.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Guide */}
      <Card className="bg-muted/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1.5">
          <p>1. Create a Klaviyo account at <a href="https://klaviyo.com" target="_blank" className="text-primary hover:underline">klaviyo.com</a></p>
          <p>2. Get your Private API Key from Klaviyo Settings → API Keys</p>
          <p>3. Add <code className="bg-muted px-1 rounded text-xs">KLAVIYO_API_KEY=your_key</code> to your server environment variables</p>
          <p>4. In Klaviyo, create Flows triggered by the events listed above</p>
          <p>5. Use the Send Campaign button to manually trigger events for bulk messaging</p>
        </CardContent>
      </Card>
    </div>
  );
}
