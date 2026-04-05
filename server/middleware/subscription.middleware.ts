import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { subscriptions, plans } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { differenceInDays } from "date-fns";

// ── Check subscription validity for every request ─────────────────────────────
export async function requireSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const userRole = (req.session as any)?.userRole;

  // SuperAdmin bypass — no subscription needed
  if (userRole === "superadmin") return next();

  // Get latest active subscription
  const [sub] = await db
    .select({ subscription: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")),
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!sub) {
    return res.status(402).json({
      code: "NO_SUBSCRIPTION",
      message: "No active subscription found. Please subscribe to continue.",
    });
  }

  const now = new Date();
  const endDate = new Date(sub.subscription.endDate);

  // Check if expired
  if (endDate < now) {
    // Mark as expired
    await db
      .update(subscriptions)
      .set({ status: "expired" })
      .where(eq(subscriptions.id, sub.subscription.id));

    return res.status(402).json({
      code: "SUBSCRIPTION_EXPIRED",
      message: "Your subscription has expired. Please renew to continue.",
    });
  }

  // Attach subscription info to request
  (req as any).subscription = sub;
  next();
}

// ── Get subscription status (for frontend) ────────────────────────────────────
export async function getSubscriptionStatus(userId: number) {
  const [sub] = await db
    .select({ subscription: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")),
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!sub) return { status: "none", daysLeft: 0, plan: null };

  const now = new Date();
  const endDate = new Date(sub.subscription.endDate);
  const daysLeft = differenceInDays(endDate, now);

  if (endDate < now) return { status: "expired", daysLeft: 0, plan: sub.plan };

  return {
    status: daysLeft <= 3 ? "expiring_soon" : "active",
    daysLeft,
    plan: sub.plan,
    subscription: sub.subscription,
    endDate: sub.subscription.endDate,
  };
}

// ── Subscription status endpoint ──────────────────────────────────────────────
export async function subscriptionStatusHandler(req: Request, res: Response) {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const userRole = (req.session as any)?.userRole;
  if (userRole === "superadmin") {
    return res.json({ status: "superadmin", daysLeft: 999, plan: null });
  }

  const status = await getSubscriptionStatus(userId);
  res.json(status);
}
