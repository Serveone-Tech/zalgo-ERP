import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Video, VideoOff, Calendar, Clock, Loader2, Users, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import DailyIframe from "@daily-co/daily-js";
import type { LiveClass } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  if (status === "live") return <Badge className="bg-red-500 hover:bg-red-500 text-white gap-1 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />LIVE</Badge>;
  if (status === "scheduled") return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Scheduled</Badge>;
  if (status === "ended") return <Badge variant="secondary">Ended</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
}

function WatchClass({ classId, studentName, onLeave }: { classId: number; studentName: string; onLeave: () => void }) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    let frame: ReturnType<typeof DailyIframe.createFrame> | null = null;
    async function join() {
      try {
        const res = await fetch(`/api/student-portal/live-classes/${classId}/join`);
        if (!res.ok) throw new Error((await res.json()).message);
        const { roomUrl, token } = await res.json();
        frame = DailyIframe.createFrame(containerRef.current!, {
          showLeaveButton: true,
          showFullscreenButton: true,
          showParticipantsBar: false,
          iframeStyle: { width: "100%", height: "100%", border: "none", position: "absolute", top: "0", left: "0" },
          // Hide mic/cam controls — students are view-only
          showMicButton: false,
          showVideoButton: false,
          showScreenShareButton: false,
        } as any);
        frame.on("left-meeting", () => { frame?.destroy().catch(() => {}); onLeave(); });
        await frame.join({ url: roomUrl, token, userName: studentName });
        setConnecting(false);
      } catch (err: any) {
        toast({ title: "Could not join class", description: err.message, variant: "destructive" });
        onLeave();
      }
    }
    join();
    return () => { frame?.leave().catch(() => {}); frame?.destroy().catch(() => {}); };
  }, [classId]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div ref={containerRef} className="flex-1 relative">
        {connecting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
            <p className="text-white/60 text-sm">Joining class...</p>
            <p className="text-white/30 text-xs">Please wait, connecting to live room</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentLiveClassesPage() {
  const [watchingId, setWatchingId] = useState<number | null>(null);
  const { user } = useAuth();
  const studentName = user?.name ?? "Student";
  const { data: classes = [], isLoading, error } = useQuery<(LiveClass & { recordingUrl?: string | null; courseName?: string | null })[]>({
    queryKey: ["/api/student-portal/live-classes"],
    refetchInterval: 15000,
  });

  if (watchingId !== null) return <WatchClass classId={watchingId} studentName={studentName} onLeave={() => setWatchingId(null)} />;

  const liveNow = classes.filter(c => c.status === "live");
  const upcoming = classes.filter(c => c.status === "scheduled");
  const past = classes.filter(c => c.status === "ended");

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Video className="w-5 h-5 text-primary" />Live Classes</h1>
        <p className="text-sm text-muted-foreground mt-1">Join your live classes and watch recordings</p>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}

      {liveNow.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Live Now</h2>
          <div className="space-y-3">
            {liveNow.map(cls => (
              <div key={cls.id} className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold">{cls.title}</span><StatusBadge status={cls.status} /></div>
                  {cls.description && <p className="text-sm text-muted-foreground mt-1">{cls.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{cls.durationMinutes} min</span>
                    {cls.startedAt && <span className="text-red-500">Started {formatDistanceToNow(new Date(cls.startedAt), { addSuffix: true })}</span>}
                  </div>
                </div>
                <Button onClick={() => setWatchingId(cls.id)} className="bg-red-500 hover:bg-red-600 text-white shrink-0"><Users className="w-4 h-4 mr-1.5" />Join</Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map(cls => (
              <div key={cls.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold">{cls.title}</span><StatusBadge status={cls.status} /></div>
                {cls.courseName && <span className="inline-block text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5 mt-1">{cls.courseName}</span>}
                {cls.description && <p className="text-sm text-muted-foreground mt-1">{cls.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(cls.scheduledAt), "dd MMM yyyy, hh:mm a")}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{cls.durationMinutes} min</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Past Classes</h2>
          <div className="space-y-2">
            {past.map(cls => (
              <div key={cls.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2"><span className="font-medium text-sm">{cls.title}</span><StatusBadge status={cls.status} /></div>
                  {(cls as any).recordingUrl && (
                    <a href={(cls as any).recordingUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30"><PlayCircle className="w-3.5 h-3.5" />Watch Recording</Button>
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(cls.scheduledAt), "dd MMM yyyy, hh:mm a")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isLoading && !error && classes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <VideoOff className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No classes available</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Your institute hasn't scheduled any live classes yet, or you are not enrolled in the relevant course.
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <VideoOff className="w-10 h-10 text-red-300 mb-3" />
          <p className="font-medium text-red-600">Access Restricted</p>
          <p className="text-sm text-muted-foreground mt-1">
            {(error as any)?.message ?? "Contact your institute for live class access."}
          </p>
        </div>
      )}
    </div>
  );
}
