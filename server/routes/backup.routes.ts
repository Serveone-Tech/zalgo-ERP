// server/routes/backup.routes.ts — REPLACE
import { Router } from "express";
import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { runBackup, listBackups } from "../utils/backup";

export const backupRouter = Router();

function checkAuth(req: Request, res: Response, next: Function) {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  next();
}

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

// ── GET /api/backups — list this admin's backups ──────────────────────────────
backupRouter.get("/", checkAuth, (req: Request, res: Response) => {
  try {
    const adminId = getAdminId(req);
    const backups = listBackups(adminId);
    res.json(backups);
  } catch (err) {
    res.status(500).json({ message: "Failed to list backups" });
  }
});

// ── POST /api/backups/run — manual backup for this admin ─────────────────────
backupRouter.post("/run", checkAuth, async (req: Request, res: Response) => {
  try {
    const adminId = getAdminId(req);
    const zipPath = await runBackup(adminId);
    const backups = listBackups(adminId);
    res.json({
      message: "Backup created successfully",
      file: path.basename(zipPath),
      totalBackups: backups.length,
    });
  } catch (err) {
    console.error("[Backup Route] Error:", err);
    res.status(500).json({ message: "Backup failed" });
  }
});

// ── GET /api/backups/download/:filename — download backup ─────────────────────
backupRouter.get(
  "/download/:filename",
  checkAuth,
  (req: Request, res: Response) => {
    try {
      const adminId = getAdminId(req);
      const { filename } = req.params;

      if (!filename.startsWith("backup_") || !filename.endsWith(".zip")) {
        return res.status(400).json({ message: "Invalid filename" });
      }

      // Look in admin's backup folder first
      const adminDir = path.join(process.cwd(), "backups", `admin_${adminId}`);
      const globalDir = path.join(process.cwd(), "backups");

      let filePath = path.join(adminDir, filename);
      if (!fs.existsSync(filePath)) {
        // Fallback to global backups dir (for older backups)
        filePath = path.join(globalDir, filename);
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Backup not found" });
      }

      res.download(filePath, filename);
    } catch (err) {
      res.status(500).json({ message: "Download failed" });
    }
  },
);

// ── DELETE /api/backups/:filename — delete a backup ──────────────────────────
backupRouter.delete("/:filename", checkAuth, (req: Request, res: Response) => {
  try {
    const adminId = getAdminId(req);
    const { filename } = req.params;

    if (!filename.startsWith("backup_") || !filename.endsWith(".zip")) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    const adminDir = path.join(process.cwd(), "backups", `admin_${adminId}`);
    const filePath = path.join(adminDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup not found" });
    }

    fs.unlinkSync(filePath);
    res.json({ message: "Backup deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});
