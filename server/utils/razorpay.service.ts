import Razorpay from "razorpay";
import crypto from "crypto";

// ── Razorpay instance ─────────────────────────────────────────────────────────
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ── Create one-time order (for monthly/yearly payment) ────────────────────────
export async function createOrder({
  amount, // in paise (₹499 = 49900)
  currency = "INR",
  receipt,
  notes = {},
}: {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  return await razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
}

// ── Create Razorpay Subscription (for auto-debit/recurring) ──────────────────
export async function createRazorpaySubscription({
  planId, // Razorpay plan ID (rzp_plan_xxx)
  totalCount, // 12 for yearly, 1 for monthly (infinite = 0)
  customerId,
  startAt, // Unix timestamp
  notes = {},
}: {
  planId: string;
  totalCount: number;
  customerId?: string;
  startAt?: number;
  notes?: Record<string, string>;
}) {
  const subData: any = {
    plan_id: planId,
    total_count: totalCount || 120, // 120 months = 10 years approx
    quantity: 1,
    notes,
  };
  if (customerId) subData.customer_id = customerId;
  if (startAt) subData.start_at = startAt;

  return await razorpay.subscriptions.create(subData);
}

// ── Create Razorpay Plan (for recurring subscriptions) ───────────────────────
export async function createRazorpayPlan({
  name,
  amount, // in paise
  interval, // 1
  period, // monthly | yearly
}: {
  name: string;
  amount: number;
  interval: number;
  period: "monthly" | "yearly";
}) {
  return await razorpay.plans.create({
    period,
    interval,
    item: {
      name,
      amount,
      currency: "INR",
    },
  });
}

// ── Verify payment signature ──────────────────────────────────────────────────
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

// ── Verify webhook signature ──────────────────────────────────────────────────
export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

// ── Cancel subscription ───────────────────────────────────────────────────────
export async function cancelRazorpaySubscription(subscriptionId: string) {
  return await razorpay.subscriptions.cancel(subscriptionId);
}

// ── Fetch subscription status ─────────────────────────────────────────────────
export async function getRazorpaySubscription(subscriptionId: string) {
  return await razorpay.subscriptions.fetch(subscriptionId);
}
