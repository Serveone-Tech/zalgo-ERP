// server/utils/expiry-warning.scheduler.ts  — NEW FILE
// Add this file and call startExpiryWarningScheduler() from server/index.ts

import { db } from "../db";
import { subscriptions, plans, users } from "@shared/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { addDays } from "date-fns";
import { trackKlaviyoEvent, upsertKlaviyoProfile, KLAVIYO_EVENTS } from "./klaviyo.service";

async function sendExpiryWarnings() {
  try {
    const now = new Date();
    const warningThresholds = [7, 3, 1]; // warn at 7, 3, and 1 day before expiry

    for (const days of warningThresholds) {
      const targetDate = addDays(now, days);
      const targetStart = new Date(targetDate);
      targetStart.setHours(0, 0, 0, 0);
      const targetEnd = new Date(targetDate);
      targetEnd.setHours(23, 59, 59, 999);

      const expiringSubs = await db
        .select({ user: users, plan: plans, sub: subscriptions })
        .from(subscriptions)
        .innerJoin(users, eq(subscriptions.userId, users.id))
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(
          and(
            eq(subscriptions.status, "active"),
            gte(subscriptions.endDate, targetStart),
            lte(subscriptions.endDate, targetEnd)
          )
        );

      for (const { user, plan, sub } of expiringSubs) {
        console.log(`[ExpiryWarning] Notifying ${user.email} — plan "${plan.name}" expires in ${days} day(s)`);
        await upsertKlaviyoProfile({
          email: user.email,
          firstName: user.name,
          properties: { planName: plan.name, daysLeft: days },
        });
        await trackKlaviyoEvent(user.email, KLAVIYO_EVENTS.PLAN_EXPIRING_SOON, {
          planName: plan.name,
          endDate: sub.endDate,
          daysLeft: days,
        });
      }
    }

    // Also mark truly expired subscriptions
    const expired = await db
      .select({ sub: subscriptions, user: users, plan: plans })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.status, "active"),
          lte(subscriptions.endDate, now)
        )
      );

    for (const { sub, user, plan } of expired) {
      await db
        .update(subscriptions)
        .set({ status: "expired" })
        .where(eq(subscriptions.id, sub.id));

      await trackKlaviyoEvent(user.email, KLAVIYO_EVENTS.PLAN_EXPIRED, {
        planName: plan.name,
        endDate: sub.endDate,
      });
      console.log(`[ExpiryWarning] Marked expired: ${user.email} plan "${plan.name}"`);
    }
  } catch (err) {
    console.error("[ExpiryWarning] Scheduler error:", err);
  }
}

export function startExpiryWarningScheduler() {
  // Run once at startup, then every 12 hours
  sendExpiryWarnings();
  setInterval(sendExpiryWarnings, 12 * 60 * 60 * 1000);
  console.log("[ExpiryWarning] Scheduler started — runs every 12 hours");
}
