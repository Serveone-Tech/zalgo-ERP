import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  RefreshCw,
  HardDrive,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { format } from "date-fns";

interface BackupFile {
  fileName: string;
  size: string;
  createdAt: string;
  path: string;
}

function useBackups() {
  return useQuery<BackupFile[]>({
    queryKey: ["/api/backups"],
    queryFn: async () => {
      const res = await fetch("/api/backups", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch backups");
      return res.json();
    },
    staleTime: 0,
    refetchInterval: 30000, // har 30 sec mein auto refresh
  });
}

export default function BackupsPage() {
  const { data: backups, isLoading, refetch } = useBackups();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  // ── Manual backup trigger ──────────────────────────────────────────────────
  const runBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/backups/run", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Backup failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      toast({
        title: "Backup Created",
        description: `${data.file} — ${data.totalBackups}/10 backups stored.`,
      });
    },
    onError: () => {
      toast({
        title: "Backup Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ── Download backup file ───────────────────────────────────────────────────
  const handleDownload = async (fileName: string) => {
    setDownloadingFile(fileName);
    try {
      const res = await fetch(`/api/backups/download/${fileName}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: fileName,
      });
    } catch {
      toast({
        title: "Download Failed",
        description: "Could not download backup file.",
        variant: "destructive",
      });
    } finally {
      setDownloadingFile(null);
    }
  };

  // ── Parse date from filename ───────────────────────────────────────────────
  const parseDateFromFilename = (fileName: string) => {
    // backup_2026-03-29_14-30-00.zip
    try {
      const match = fileName.match(
        /backup_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/,
      );
      if (!match) return null;
      const [, date, time] = match;
      const timeFormatted = time.replace(/-/g, ":");
      return new Date(`${date}T${timeFormatted}`);
    } catch {
      return null;
    }
  };

  const totalBackups = backups?.length || 0;
  const latestBackup = backups?.[0];
  const oldestBackup = backups?.[backups.length - 1];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Data Backups
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automatic daily backups — last 10 days retained
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {isAdmin && (
            <Button
              className="rounded-xl shadow-md shadow-primary/20"
              onClick={() => runBackupMutation.mutate()}
              disabled={runBackupMutation.isPending}
            >
              <Play className="w-4 h-4 mr-2" />
              {runBackupMutation.isPending ? "Creating..." : "Backup Now"}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Backups
            </p>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">{totalBackups}</p>
          <p className="text-xs text-muted-foreground mt-1">of 10 max</p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Storage Used
            </p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {backups
              ? `${backups
                  .reduce((sum, b) => sum + parseFloat(b.size), 0)
                  .toFixed(1)} MB`
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">total size</p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Latest Backup
            </p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {latestBackup
              ? format(new Date(latestBackup.createdAt), "dd MMM yyyy")
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {latestBackup
              ? format(new Date(latestBackup.createdAt), "hh:mm a")
              : "No backups yet"}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Next Auto Backup
            </p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground">12:00 AM</p>
          <p className="text-xs text-muted-foreground mt-1">daily midnight</p>
        </div>
      </div>

      {/* Backup Schedule Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-foreground">
          <span className="font-semibold">Auto Backup Schedule: </span>
          Har roz raat 12:00 AM par automatic backup hota hai. Maximum 10
          backups store hote hain — 11th backup aane par sabse purana
          automatically delete ho jata hai. Backup project ke{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
            /backups
          </code>{" "}
          folder mein save hota hai.
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Backup Files</h2>
          {totalBackups > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalBackups} / 10
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading backups...
          </div>
        ) : !backups || backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Archive className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">No backups yet</p>
            <p className="text-sm text-muted-foreground">
              First backup will run tonight at 12:00 AM
            </p>
            {isAdmin && (
              <Button
                variant="outline"
                className="rounded-xl mt-2"
                onClick={() => runBackupMutation.mutate()}
                disabled={runBackupMutation.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                Create First Backup Now
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {backups.map((backup, index) => {
              const parsedDate = parseDateFromFilename(backup.fileName);
              const isLatest = index === 0;
              const isOldest = index === backups.length - 1;
              const isDownloading = downloadingFile === backup.fileName;

              return (
                <div
                  key={backup.fileName}
                  className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isLatest
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Archive className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate font-mono">
                        {backup.fileName}
                      </p>
                      {isLatest && (
                        <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                          Latest
                        </Badge>
                      )}
                      {isOldest && backups.length >= 10 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-amber-600 border-amber-200 shrink-0"
                        >
                          Will be deleted next
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {parsedDate
                        ? format(parsedDate, "dd MMMM yyyy, hh:mm a")
                        : format(
                            new Date(backup.createdAt),
                            "dd MMMM yyyy, hh:mm a",
                          )}{" "}
                      • {backup.size}
                    </p>
                  </div>

                  {/* Download Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl shrink-0"
                    onClick={() => handleDownload(backup.fileName)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {isDownloading ? "Downloading..." : "Download"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
