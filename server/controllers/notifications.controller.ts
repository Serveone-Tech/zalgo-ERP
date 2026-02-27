import type { Request, Response } from "express";
import { storage } from "../storage";

export const NotificationsController = {
  async list(req: Request, res: Response) {
    const notifs = await storage.getNotifications();
    res.json(notifs);
  },
  async markRead(req: Request, res: Response) {
    await storage.markNotificationRead(Number(req.params.id));
    res.json({ success: true });
  },
  async markAllRead(req: Request, res: Response) {
    await storage.markAllNotificationsRead();
    res.json({ success: true });
  },
};
