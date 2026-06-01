import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, VideoOff, ChevronLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DailyIframe from "@daily-co/daily-js";
import type { LiveClass } from "@shared/schema";

export default function LiveClassWatchPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const classId = Number(id);

  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<ReturnType<typeof DailyIframe.createFrame> | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const { data: cls, isLoading } = useQuery<LiveClass>({
    queryKey: [`/api/live-classes/${classId}`],
    queryFn: async () => {
      // We use the list endpoint and filter — or add a single endpoint later
      const res = await fetch("/api/live-classes");
      if (!res.ok) throw new Error("Failed to fetch classes");
      const all: LiveClass[] = await res.json();
      const found = all.find((c) => c.id === classId);
      if (!found) throw new Error("Class not found");
      return found;
    },
    refetchInterval: (query) => (query.state.data?.status === "live" ? false : 5000),
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      frameRef.current?.leave().catch(() => {});
      frameRef.current?.destroy().catch(() => {});
    };
  }, []);

  async function joinClass() {
    if (!containerRef.current || joining) return;
    setJoining(true);

    try {
      const res = await fetch(`/api/live-classes/${classId}/join`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      const { roomUrl, token } = await res.json();

      const frame = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: true,
        showFullscreenButton: true,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "none",
          position: "absolute",
          top: "0",
          left: "0",
        },
      });
      frameRef.current = frame;

      frame.on("left-meeting", () => {
        frame.destroy().catch(() => {});
        frameRef.current = null;
        setJoined(false);
        navigate("/live-classes");
      });

      await frame.join({ url: roomUrl, token });
      setJoined(true);
    } catch (err: any) {
      toast({ title: "Could not join class", description: err.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <VideoOff className="w-12 h-12 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">Class not found</p>
        <Button variant="outline" onClick={() => navigate("/live-classes")}>
          Back to Live Classes
        </Button>
      </div>
    );
  }

  // Class not live yet
  if (cls.status !== "live" && !joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <VideoOff className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-1">{cls.title}</h2>
        {cls.status === "scheduled" && (
          <p className="text-muted-foreground text-sm mb-6">
            This class hasn't started yet. Please check back later.
          </p>
        )}
        {cls.status === "ended" && (
          <p className="text-muted-foreground text-sm mb-6">
            This class has ended.
          </p>
        )}
        {cls.status === "cancelled" && (
          <p className="text-muted-foreground text-sm mb-6">
            This class was cancelled.
          </p>
        )}
        <Button variant="outline" onClick={() => navigate("/live-classes")}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      {!joined && (
        <div className="px-6 py-4 border-b">
          <button
            onClick={() => navigate("/live-classes")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Live Classes
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Live Now</span>
              </div>
              <h1 className="text-xl font-bold mt-1">{cls.title}</h1>
              {cls.description && (
                <p className="text-sm text-muted-foreground mt-1">{cls.description}</p>
              )}
            </div>
            <Button
              onClick={joinClass}
              disabled={joining}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Join Class
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Daily.co frame container */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-black"
        style={{ minHeight: joined ? "100%" : 0 }}
      />
    </div>
  );
}
