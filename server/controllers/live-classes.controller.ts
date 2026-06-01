import type { Request, Response } from "express";
import { db } from "../db";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { liveClasses } from "@shared/schema";
import {
  createDailyRoom,
  createMeetingToken,
  deleteDailyRoom,
  isDailyConfigured,
} from "../utils/daily.service";
import { addMinutes, addHours } from "date-fns";

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

export const LiveClassesController = {
  async checkSetup(_req: Request, res: Response) {
    res.json({ configured: isDailyConfigured() });
  },

  async list(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const classes = await db
      .select()
      .from(liveClasses)
      .where(eq(liveClasses.adminId, adminId))
      .orderBy(desc(liveClasses.scheduledAt));
    res.json(classes);
  },

  async create(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const schema = z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      scheduledAt: z.string().datetime(),
      durationMinutes: z.number().min(15).max(480).default(60),
    });

    try {
      const data = schema.parse(req.body);

      if (!isDailyConfigured()) {
        return res.status(503).json({
          message: "Live class service not configured. Add DAILY_API_KEY to server environment.",
        });
      }

      const roomName = `cls-${adminId}-${Date.now()}`;
      const expiry = addHours(
        new Date(data.scheduledAt),
        Math.ceil(data.durationMinutes / 60) + 3,
      );

      const room = await createDailyRoom(roomName, expiry);

      const [cls] = await db
        .insert(liveClasses)
        .values({
          adminId,
          title: data.title,
          description: data.description ?? null,
          scheduledAt: new Date(data.scheduledAt),
          durationMinutes: data.durationMinutes,
          dailyRoomName: room.name,
          dailyRoomUrl: room.url,
          status: "scheduled",
        })
        .returning();

      res.status(201).json(cls);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      const message = err instanceof Error ? err.message : "Failed to create class";
      return res.status(500).json({ message });
    }
  },

  async start(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const id = Number(req.params.id);

    const [cls] = await db
      .select()
      .from(liveClasses)
      .where(and(eq(liveClasses.id, id), eq(liveClasses.adminId, adminId)));

    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.status === "ended")
      return res.status(400).json({ message: "Class has already ended" });
    if (cls.status === "cancelled")
      return res.status(400).json({ message: "Class is cancelled" });
    if (!cls.dailyRoomName)
      return res.status(400).json({ message: "Room not configured for this class" });

    try {
      const expiry = addMinutes(new Date(), (cls.durationMinutes ?? 60) + 120);
      const token = await createMeetingToken(cls.dailyRoomName, true, expiry);

      await db
        .update(liveClasses)
        .set({ status: "live", startedAt: new Date(), updatedAt: new Date() })
        .where(eq(liveClasses.id, id));

      res.json({ roomUrl: cls.dailyRoomUrl, token, roomName: cls.dailyRoomName });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start class";
      return res.status(500).json({ message });
    }
  },

  async end(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const id = Number(req.params.id);

    const [cls] = await db
      .select()
      .from(liveClasses)
      .where(and(eq(liveClasses.id, id), eq(liveClasses.adminId, adminId)));

    if (!cls) return res.status(404).json({ message: "Class not found" });

    await db
      .update(liveClasses)
      .set({ status: "ended", endedAt: new Date(), updatedAt: new Date() })
      .where(eq(liveClasses.id, id));

    res.json({ success: true });
  },

  async join(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const id = Number(req.params.id);

    const [cls] = await db
      .select()
      .from(liveClasses)
      .where(and(eq(liveClasses.id, id), eq(liveClasses.adminId, adminId)));

    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.status !== "live")
      return res.status(400).json({ message: "Class is not live right now" });
    if (!cls.dailyRoomName)
      return res.status(400).json({ message: "Room not configured" });

    try {
      const expiry = addHours(new Date(), 4);
      const token = await createMeetingToken(cls.dailyRoomName, false, expiry);
      res.json({ roomUrl: cls.dailyRoomUrl, token });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to join class";
      return res.status(500).json({ message });
    }
  },

  async cancel(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const id = Number(req.params.id);

    const [cls] = await db
      .select()
      .from(liveClasses)
      .where(and(eq(liveClasses.id, id), eq(liveClasses.adminId, adminId)));

    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.status === "live")
      return res.status(400).json({ message: "Cannot cancel a live class. End it first." });

    if (cls.dailyRoomName) {
      try { await deleteDailyRoom(cls.dailyRoomName); } catch (_) {}
    }

    await db
      .update(liveClasses)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(liveClasses.id, id));

    res.json({ success: true });
  },
};
