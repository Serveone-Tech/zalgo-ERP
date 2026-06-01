import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNow, isPast, isWithinInterval, addMinutes } from "date-fns";
import {
  Video,
  VideoOff,
  Plus,
  Play,
  Square,
  Clock,
  Calendar,
  Users,
  Lock,
  Sparkles,
  Wifi,
  Mic,
  Camera,
  X,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { LiveClass } from "@shared/schema";

// ─── Premium Gate ─────────────────────────────────────────────────────────────
function PremiumGate() {
  const [, navigate] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Video className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow">
              <Lock className="w-4 h-4 text-amber-900" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Live Classes</h1>
        <p className="text-muted-foreground mb-8">
          Conduct live video classes with your students directly from the platform.
          Connect your external camera &amp; mic for a professional streaming experience.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
          {[
            { icon: Camera, title: "External Camera", desc: "Connect any USB camera for HD video" },
            { icon: Mic, title: "External Mic", desc: "Crystal-clear audio with any mic" },
            { icon: Users, title: "Up to 500 Students", desc: "Stream to your entire batch at once" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-muted/40 p-4">
              <f.icon className="w-5 h-5 text-violet-500 mb-2" />
              <p className="font-medium text-sm">{f.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
          <Button
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
            onClick={() => navigate("/pricing")}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Unlock
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "live")
    return (
      <Badge className="bg-red-500 hover:bg-red-500 text-white gap-1 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
        LIVE
      </Badge>
    );
  if (status === "scheduled")
    return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Scheduled</Badge>;
  if (status === "ended")
    return <Badge variant="secondary">Ended</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
}

// ─── Schedule form schema ─────────────────────────────────────────────────────
const scheduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduleDate: z.string().min(1, "Date is required"),
  scheduleTime: z.string().min(1, "Time is required"),
  durationMinutes: z.coerce.number().min(15).max(480),
});
type ScheduleForm = z.infer<typeof scheduleSchema>;

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LiveClassesPage() {
  const { canUseModule } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);

  if (!canUseModule("live_classes")) return <PremiumGate />;

  const { data: classes = [], isLoading } = useQuery<LiveClass[]>({
    queryKey: ["/api/live-classes"],
  });

  const { data: setupStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/live-classes/setup-status"],
  });

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { durationMinutes: 60, scheduleDate: "", scheduleTime: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ScheduleForm) => {
      const scheduledAt = new Date(`${data.scheduleDate}T${data.scheduleTime}:00`).toISOString();
      const res = await fetch("/api/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          durationMinutes: data.durationMinutes,
          scheduledAt,
        }),
      });
      if (!res.ok) {
        let message = "Failed to schedule class";
        try { message = (await res.json()).message; } catch (_) {}
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-classes"] });
      setScheduleOpen(false);
      form.reset();
      toast({ title: "Class scheduled!", description: "Your live class has been created." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/live-classes/${id}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-classes"] });
      setCancelTarget(null);
      toast({ title: "Class cancelled" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const canGoLive = (cls: LiveClass) => {
    if (cls.status === "live") return true;
    if (cls.status !== "scheduled") return false;
    // Allow go-live 30 mins before scheduled time
    const window = { start: addMinutes(new Date(cls.scheduledAt), -30), end: addMinutes(new Date(cls.scheduledAt), cls.durationMinutes) };
    return isWithinInterval(new Date(), window) || isPast(new Date(cls.scheduledAt));
  };

  const liveClasses = classes.filter((c) => c.status === "live");
  const upcomingClasses = classes.filter((c) => c.status === "scheduled");
  const pastClasses = classes.filter((c) => c.status === "ended" || c.status === "cancelled");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-violet-500" />
            Live Classes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule and conduct live video classes for your students
          </p>
        </div>
        <Button
          onClick={() => setScheduleOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Class
        </Button>
      </div>

      {/* Setup warning */}
      {setupStatus && !setupStatus.configured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Daily.co API key not configured</p>
            <p className="mt-1 text-amber-700">
              Add <code className="bg-amber-100 px-1 rounded">DAILY_API_KEY</code> to your server
              environment. Get a free key at{" "}
              <a href="https://dashboard.daily.co" target="_blank" rel="noreferrer" className="underline">
                dashboard.daily.co
              </a>
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <Wifi className="w-5 h-5 animate-pulse mr-2" />
          Loading classes...
        </div>
      )}

      {/* Live now */}
      {liveClasses.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Live Now
          </h2>
          <div className="space-y-3">
            {liveClasses.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                onGoLive={() => navigate(`/live-classes/${cls.id}/studio`)}
                onCancel={() => setCancelTarget(cls.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingClasses.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcomingClasses.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                canGoLive={canGoLive(cls)}
                onGoLive={() => navigate(`/live-classes/${cls.id}/studio`)}
                onCancel={() => setCancelTarget(cls.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {pastClasses.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Past Classes
          </h2>
          <div className="space-y-3">
            {pastClasses.map((cls) => (
              <ClassCard key={cls.id} cls={cls} />
            ))}
          </div>
        </section>
      )}

      {!isLoading && classes.length === 0 && (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <VideoOff className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No classes yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Schedule your first live class to get started
          </p>
        </div>
      )}

      {/* Schedule dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule a Live Class</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((d) => createMutation.mutate(d))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Physics Chapter 5 - Optics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Topics to be covered, requirements..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduleDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduleTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScheduleOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {createMutation.isPending ? "Scheduling..." : "Schedule Class"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <Dialog open={cancelTarget !== null} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this class?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The scheduled class will be cancelled and the room will be deleted.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelTarget && cancelMutation.mutate(cancelTarget)}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Class Card ───────────────────────────────────────────────────────────────
function ClassCard({
  cls,
  canGoLive,
  onGoLive,
  onCancel,
}: {
  cls: LiveClass;
  canGoLive?: boolean;
  onGoLive?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold truncate">{cls.title}</span>
          <StatusBadge status={cls.status} />
        </div>
        {cls.description && (
          <p className="text-sm text-muted-foreground mt-1 truncate">{cls.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(cls.scheduledAt), "dd MMM yyyy, hh:mm a")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {cls.durationMinutes} min
          </span>
          {cls.status === "scheduled" && !isPast(new Date(cls.scheduledAt)) && (
            <span className="text-blue-500">
              Starts {formatDistanceToNow(new Date(cls.scheduledAt), { addSuffix: true })}
            </span>
          )}
          {cls.status === "live" && cls.startedAt && (
            <span className="text-red-500">
              Started {formatDistanceToNow(new Date(cls.startedAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {cls.status === "live" && onGoLive && (
          <Button size="sm" onClick={onGoLive} className="bg-red-500 hover:bg-red-600 text-white gap-1">
            <Play className="w-3.5 h-3.5" />
            Re-join Studio
          </Button>
        )}
        {cls.status === "scheduled" && canGoLive && onGoLive && (
          <Button size="sm" onClick={onGoLive} className="bg-violet-600 hover:bg-violet-700 text-white gap-1">
            <Play className="w-3.5 h-3.5" />
            Go Live
          </Button>
        )}
        {(cls.status === "scheduled" || cls.status === "live") && onCancel && (
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={onCancel}>
            {cls.status === "live" ? <Square className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}
