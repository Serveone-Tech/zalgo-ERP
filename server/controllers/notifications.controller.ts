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
import { eq, and, lte, ne } from "drizzle-orm";

// ── Smart notification refresh ────────────────────────────────────────────────
// 1. Paid installments ki notifications delete karo
// 2. Genuinely overdue (pending + past due date) ke liye nayi notifications banao
export async function refreshOverdueNotifications(): Promise<void> {
  try {
    // Step 1: Saari existing fee-overdue notifications delete karo
    await db
      .delete(notifications)
      .where(eq(notifications.relatedType, "installment"));

    // Step 2: Genuinely overdue installments fetch karo
    // (status = pending AND dueDate < today)
    const now = new Date();
    const overdueInstallments = await db
      .select({
        inst: feeInstallments,
        student: students,
      })
      .from(feeInstallments)
      .innerJoin(students, eq(feeInstallments.studentId, students.id))
      .where(
        and(
          eq(feeInstallments.status, "pending"),
          lte(feeInstallments.dueDate, now),
        ),
      );

    // Step 3: Har overdue installment ke liye notification banao
    for (const { inst, student } of overdueInstallments) {
      const pending = inst.amount - (inst.paidAmount ?? 0);
      if (pending <= 0) continue; // already fully paid, skip

      await storage.createNotification({
        title: "Fee Installment Overdue",
        message: `${student.name} ka installment #${inst.installmentNo} overdue hai — ₹${pending.toLocaleString("en-IN")} pending`,
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

  // ── DELETE single notification ─────────────────────────────────────────────
  async deleteOne(req: Request, res: Response) {
    await db
      .delete(notifications)
      .where(eq(notifications.id, Number(req.params.id)));
    res.status(204).send();
  },

  // ── DELETE all read notifications ──────────────────────────────────────────
  async clearRead(req: Request, res: Response) {
    await db.delete(notifications).where(eq(notifications.isRead, true));
    res.json({ success: true });
  },

  // ── Manual refresh trigger (admin) ─────────────────────────────────────────
  async refresh(req: Request, res: Response) {
    await refreshOverdueNotifications();
    const notifs = await storage.getNotifications();
    res.json({ success: true, count: notifs.length });
  },
};
