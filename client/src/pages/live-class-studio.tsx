import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Mic,
  MicOff,
  VideoOff,
  Play,
  Square,
  RefreshCw,
  ChevronLeft,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import DailyIframe from "@daily-co/daily-js";

type DeviceInfo = { deviceId: string; label: string };

// ─── Device setup step ────────────────────────────────────────────────────────
function DeviceSetup({
  onStart,
  recordingEnabled,
  onToggleRecording,
}: {
  onStart: (cameraId: string, micId: string) => void;
  recordingEnabled: boolean;
  onToggleRecording: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [mics, setMics] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMic, setSelectedMic] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const stopPreview = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const startPreview = useCallback(
    async (cameraId?: string, micId?: string) => {
      stopPreview();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameraId ? { deviceId: { exact: cameraId } } : true,
          audio: micId ? { deviceId: { exact: micId } } : true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Audio level meter
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setAudioLevel(Math.min(100, (avg / 128) * 100));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();

        setPermissionDenied(false);
      } catch (err: any) {
        if (err.name === "NotAllowedError") setPermissionDenied(true);
        else toast({ title: "Camera/Mic Error", description: err.message, variant: "destructive" });
      }
    },
    [stopPreview, toast],
  );

  // Enumerate devices after permission grant
  const loadDevices = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices
      .filter((d) => d.kind === "videoinput")
      .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));
    const micsArr = devices
      .filter((d) => d.kind === "audioinput")
      .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` }));
    setCameras(cams);
    setMics(micsArr);
    if (cams.length) setSelectedCamera((p) => p || cams[0].deviceId);
    if (micsArr.length) setSelectedMic((p) => p || micsArr[0].deviceId);
  }, []);

  useEffect(() => {
    startPreview().then(loadDevices);
    return stopPreview;
  }, []);

  // Re-start preview when device selection changes
  useEffect(() => {
    if (selectedCamera || selectedMic) startPreview(selectedCamera, selectedMic);
  }, [selectedCamera, selectedMic]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <a href="/live-classes" className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back
        </a>
        <span className="text-white/20">|</span>
        <span className="font-semibold">Device Setup</span>
        <span className="ml-auto text-xs text-white/40">Step 1 of 2</span>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row gap-0">
        {/* Camera preview */}
        <div className="flex-1 flex items-center justify-center bg-black relative min-h-[300px]">
          {permissionDenied ? (
            <div className="text-center p-8">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="font-semibold text-amber-400">Camera / Mic permission denied</p>
              <p className="text-sm text-white/50 mt-2">
                Please allow camera and microphone access in your browser settings, then refresh.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => startPreview()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-w-2xl rounded-xl object-cover aspect-video"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full px-4 py-2">
                <Camera className="w-4 h-4 text-white/60" />
                <span className="text-xs text-white/60">Preview</span>
              </div>
            </>
          )}
        </div>

        {/* Controls panel */}
        <div className="w-full lg:w-80 bg-gray-900 p-6 flex flex-col gap-6 border-l border-white/10">
          <div>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Select Your Devices
            </h2>

            {/* Camera */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-white/50 uppercase tracking-wide flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Camera
              </label>
              {cameras.length === 0 ? (
                <p className="text-xs text-white/30">No cameras found</p>
              ) : (
                <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                  <SelectTrigger className="bg-gray-800 border-white/10 text-white">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/10 text-white">
                    {cameras.map((c) => (
                      <SelectItem key={c.deviceId} value={c.deviceId} className="focus:bg-white/10">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Microphone */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-white/50 uppercase tracking-wide flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                Microphone
              </label>
              {mics.length === 0 ? (
                <p className="text-xs text-white/30">No microphones found</p>
              ) : (
                <Select value={selectedMic} onValueChange={setSelectedMic}>
                  <SelectTrigger className="bg-gray-800 border-white/10 text-white">
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/10 text-white">
                    {mics.map((m) => (
                      <SelectItem key={m.deviceId} value={m.deviceId} className="focus:bg-white/10">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Audio level */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 uppercase tracking-wide flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Audio Level
              </label>
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-75 rounded-full"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <p className="text-xs text-white/30">
                {audioLevel > 5 ? "Microphone is working" : "Speak to test your mic"}
              </p>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            {/* Recording toggle */}
            <div
              role="button"
              onClick={() => onToggleRecording(!recordingEnabled)}
              className={`flex items-center justify-between rounded-lg p-3 cursor-pointer border transition-colors ${recordingEnabled ? "bg-red-500/20 border-red-500/40" : "bg-white/5 border-white/10"}`}
            >
              <div>
                <p className="text-sm font-medium text-white/80">Record this class</p>
                <p className="text-xs text-white/40 mt-0.5">Save for students to watch later</p>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${recordingEnabled ? "bg-red-500" : "bg-white/20"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${recordingEnabled ? "left-5" : "left-0.5"}`} />
              </div>
            </div>

            <div className="rounded-lg bg-white/5 p-3 text-xs text-white/50 space-y-1">
              <p className="font-medium text-white/70">Tips for best quality</p>
              <p>• Use a USB camera for HD video</p>
              <p>• Plug in your external mic before selecting</p>
              <p>• Ensure good lighting behind your camera</p>
            </div>
            <Button
              size="lg"
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold"
              disabled={permissionDenied || (!selectedCamera && !selectedMic)}
              onClick={() => {
                stopPreview();
                onStart(selectedCamera, selectedMic);
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Live Class
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live broadcasting step ───────────────────────────────────────────────────
function LiveBroadcast({
  classId,
  cameraId,
  micId,
  adminName,
  recordingEnabled,
  onEnd,
}: {
  classId: number;
  cameraId: string;
  micId: string;
  adminName: string;
  recordingEnabled: boolean;
  onEnd: () => void;
}) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<ReturnType<typeof DailyIframe.createFrame> | null>(null);
  const queryClient = useQueryClient();
  const [joining, setJoining] = useState(true);
  const [ending, setEnding] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const endMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/live-classes/${classId}/end`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-classes"] });
      onEnd();
    },
    onError: (e: Error) =>
      toast({ title: "Error ending class", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (!containerRef.current) return;
    let frame: ReturnType<typeof DailyIframe.createFrame> | null = null;

    async function init() {
      try {
        const startRes = await fetch(`/api/live-classes/${classId}/start`, { method: "POST" });
        if (!startRes.ok) {
          const err = await startRes.json();
          toast({ title: "Failed to start class", description: err.message, variant: "destructive" });
          onEnd();
          return;
        }
        const { roomUrl, token } = await startRes.json();

        frame = DailyIframe.createFrame(containerRef.current!, {
          showLeaveButton: false,
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

        // Pass userName so Daily.co skips the name-entry pre-call dialog
        await frame.join({ url: roomUrl, token, userName: adminName });

        // Apply user-selected devices after joining
        if (cameraId || micId) {
          await frame.setInputDevicesAsync({
            ...(cameraId ? { videoDeviceId: cameraId } : {}),
            ...(micId ? { audioDeviceId: micId } : {}),
          }).catch(() => {});
        }

        // Start recording if admin enabled it
        if (recordingEnabled) {
          try {
            await frame.startRecording();
            setIsRecording(true);
            // Tell server recording is active
            fetch(`/api/live-classes/${classId}/recording/start`, { method: "POST" }).catch(() => {});
          } catch (err: any) {
            toast({ title: "Recording unavailable", description: err.message, variant: "destructive" });
          }
        }

        setJoining(false);
      } catch (err: any) {
        toast({ title: "Connection error", description: err.message, variant: "destructive" });
        onEnd();
      }
    }

    init();

    return () => {
      frame?.leave().catch(() => {});
      frame?.destroy().catch(() => {});
    };
  }, [classId, cameraId, micId]);

  const handleEnd = async () => {
    setEnding(true);
    // Stop recording before leaving so Daily.co can save it
    if (isRecording) {
      try { frameRef.current?.stopRecording(); } catch (_) {}
      // Give Daily.co a moment to process
      await new Promise((r) => setTimeout(r, 2000));
    }
    await frameRef.current?.leave().catch(() => {});
    await frameRef.current?.destroy().catch(() => {});
    endMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-semibold text-red-400 text-sm">LIVE</span>
          {isRecording && (
            <span className="flex items-center gap-1 text-xs text-white/60 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              REC
            </span>
          )}
        </div>
        <span className="ml-auto">
          <Button size="sm" variant="destructive" onClick={handleEnd} disabled={ending}>
            {ending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Square className="w-4 h-4 mr-2" />
            )}
            End Class
          </Button>
        </span>
      </div>

      <div ref={containerRef} className="flex-1 relative bg-black" style={{ minHeight: "calc(100vh - 56px)" }}>
        {joining && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            <p className="text-white/60 text-sm">Connecting to live room...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Studio page (orchestrates setup → broadcast) ─────────────────────────────
export default function LiveClassStudioPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const classId = Number(id);
  const { user } = useAuth();

  const [phase, setPhase] = useState<"setup" | "live">("setup");
  const [cameraId, setCameraId] = useState("");
  const [micId, setMicId] = useState("");
  const [recordingEnabled, setRecordingEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("liveclass_devices");
    if (saved) {
      try {
        const { camera, mic } = JSON.parse(saved);
        if (camera) setCameraId(camera);
        if (mic) setMicId(mic);
      } catch (_) {}
    }
  }, []);

  function handleStart(camera: string, mic: string) {
    setCameraId(camera);
    setMicId(mic);
    localStorage.setItem("liveclass_devices", JSON.stringify({ camera, mic }));
    setPhase("live");
  }

  if (phase === "live") {
    return (
      <LiveBroadcast
        classId={classId}
        cameraId={cameraId}
        micId={micId}
        adminName={user?.name ?? "Admin"}
        recordingEnabled={recordingEnabled}
        onEnd={() => navigate("/live-classes")}
      />
    );
  }

  return <DeviceSetup onStart={handleStart} recordingEnabled={recordingEnabled} onToggleRecording={setRecordingEnabled} />;
}
