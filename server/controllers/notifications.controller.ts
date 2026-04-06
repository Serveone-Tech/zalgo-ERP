// ─────────────────────────────────────────────────────────────────────────────
// server/controllers/notifications.controller.ts — REPLACE
// ─────────────────────────────────────────────────────────────────────────────
import type { Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import {
  notifications,
  feeInstallments,
  students,
  feePlans,
  courses,
} from "@shared/schema";
import { eq, and, lte } from "drizzle-orm";

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

export async function refreshOverdueNotifications(): Promise<void> {
  try {
    await db
      .delete(notifications)
      .where(eq(notifications.relatedType, "installment"));
    const now = new Date();
    const overdueInstallments = await db
      .select({ inst: feeInstallments, student: students })
      .from(feeInstallments)
      .innerJoin(students, eq(feeInstallments.studentId, students.id))
      .where(
        and(
          eq(feeInstallments.status, "pending"),
          lte(feeInstallments.dueDate, now),
        ),
      );

    for (const { inst, student } of overdueInstallments) {
      const pending = inst.amount - (inst.paidAmount ?? 0);
      if (pending <= 0) continue;
      await storage.createNotification({
        title: "Fee Installment Overdue",
        message: `Installment #${inst.installmentNo} for ${student.name} is overdue — ₹${pending.toLocaleString("en-IN")} is pending`,
        type: "warning",
        relatedId: inst.id,
        relatedType: "installment",
      });
    }
    console.log(
      `[Notifications] Refreshed — ${overdueInstallments.length} overdue installments found`,
    );
  } catch (err) {
    console.error("[Notifications] Refresh failed:", err);
  }
}

export const NotificationsController = {
  async list(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const notifs = await storage.getNotifications(adminId);
    res.json(notifs);
  },

  async markRead(req: Request, res: Response) {
    await storage.markNotificationRead(Number(req.params.id));
    res.json({ success: true });
  },

  async markAllRead(req: Request, res: Response) {
    const adminId = getAdminId(req);
    await storage.markAllNotificationsRead(adminId);
    res.json({ success: true });
  },

  async deleteOne(req: Request, res: Response) {
    await db
      .delete(notifications)
      .where(eq(notifications.id, Number(req.params.id)));
    res.status(204).send();
  },

  async clearRead(req: Request, res: Response) {
    await db.delete(notifications).where(eq(notifications.isRead, true));
    res.json({ success: true });
  },

  async refresh(req: Request, res: Response) {
    const adminId = getAdminId(req);
    await refreshOverdueNotifications();
    const notifs = await storage.getNotifications(adminId);
    res.json({ success: true, count: notifs.length });
  },
};
