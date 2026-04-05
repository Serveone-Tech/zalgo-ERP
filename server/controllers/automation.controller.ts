// server/controllers/automation.controller.ts  — NEW FILE
import type { Request, Response } from "express";
import {
  upsertKlaviyoProfile,
  trackKlaviyoEvent,
  addToKlaviyoList,
  getKlaviyoLists,
  KLAVIYO_EVENTS,
} from "../utils/klaviyo.service";
import { db } from "../db";
import { students, leads, users, subscriptions, plans } from "@shared/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";
import { addDays } from "date-fns";

export const AutomationController = {
  // ── Get Klaviyo lists for dropdown ──────────────────────────────────────────
  async getLists(req: Request, res: Response) {
    const lists = await getKlaviyoLists();
    res.json(lists);
  },

  // ── Send a manual automation campaign ───────────────────────────────────────
  async sendCampaign(req: Request, res: Response) {
    const {
      eventName,
      audience,   // "all_students" | "all_leads" | "expiring_soon" | "custom_list"
      listId,     // Klaviyo list ID (for custom_list)
      properties, // extra properties to send with event
      filter,     // optional: { branchId, status }
    } = req.body;

    if (!eventName) {
      return res.status(400).json({ message: "eventName is required" });
    }

    let profiles: Array<{ email: string; phone?: string; name?: string; properties?: Record<string, any> }> = [];

    if (audience === "all_students") {
      const allStudents = await db.select().from(students);
      profiles = allStudents
        .filter((s) => s.email)
        .map((s) => ({
          email: s.email!,
          phone: s.phone,
          name: s.name,
          properties: { enrollmentNo: s.enrollmentNo, status: s.status, ...(properties || {}) },
        }));
    } else if (audience === "all_leads") {
      const allLeads = await db.select().from(leads);
      profiles = allLeads.map((l) => ({
        email: `lead_${l.id}@noreply.zalgo.in`, // leads may not have email
        phone: l.phone,
        name: l.studentName,
        properties: { courseInterested: l.courseInterested, status: l.status, ...(properties || {}) },
      }));
    } else if (audience === "expiring_soon") {
      // Users whose subscription ends in <= 7 days
      const soon = addDays(new Date(), 7);
      const expiringSubs = await db
        .select({ user: users, plan: plans, sub: subscriptions })
        .from(subscriptions)
        .innerJoin(users, eq(subscriptions.userId, users.id))
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(
          and(
            eq(subscriptions.status, "active"),
            lte(subscriptions.endDate, soon)
          )
        );
      profiles = expiringSubs.map(({ user, plan, sub }) => ({
        email: user.email,
        name: user.name,
        properties: {
          planName: plan.name,
          endDate: sub.endDate,
          daysLeft: Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000),
          ...(properties || {}),
        },
      }));
    } else if (audience === "custom_list" && listId) {
      // Just track event for existing list members — handled via Klaviyo flow
      const result = await addToKlaviyoList(listId, []);
      return res.json({ message: "Triggered for custom list", result });
    }

    if (profiles.length === 0) {
      return res.json({ message: "No profiles matched the audience criteria", sent: 0 });
    }

    // Upsert profiles and track event
    let sent = 0;
    const errors: string[] = [];
    for (const p of profiles) {
      if (!p.email || p.email.includes("@noreply")) continue;
      await upsertKlaviyoProfile({ email: p.email, phone: p.phone, firstName: p.name, properties: p.properties });
      const result = await trackKlaviyoEvent(p.email, eventName, p.properties);
      if (result.success) sent++;
      else errors.push(`${p.email}: ${result.error}`);
    }

    res.json({
      message: `Campaign sent to ${sent}/${profiles.length} profiles`,
      sent,
      total: profiles.length,
      errors: errors.slice(0, 5),
    });
  },

  // ── Get automation event definitions ────────────────────────────────────────
  async getEventTypes(_req: Request, res: Response) {
    res.json(Object.entries(KLAVIYO_EVENTS).map(([key, value]) => ({ key, label: value })));
  },

  // ── Get campaign stats (stub — real stats come from Klaviyo dashboard) ──────
  async getStats(_req: Request, res: Response) {
    const isConfigured = !!process.env.KLAVIYO_API_KEY;
    res.json({
      configured: isConfigured,
      message: isConfigured
        ? "Klaviyo is connected. View detailed stats in your Klaviyo dashboard."
        : "Klaviyo API key not configured. Set KLAVIYO_API_KEY in environment variables.",
    });
  },
};
