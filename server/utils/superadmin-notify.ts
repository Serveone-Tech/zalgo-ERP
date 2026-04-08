// server/utils/superadmin-notify.ts — NEW FILE
// SuperAdmin ko notifications bhejne ke liye
// Triggers: new registration, plan expiring, plan expired

import nodemailer from "nodemailer";

// SuperAdmin contact details — .env se lena chahiye
const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL || "support@zalgostore.com";
const SUPERADMIN_WHATSAPP = process.env.SUPERADMIN_WHATSAPP || "+917470889548";
const APP_NAME = process.env.APP_NAME || "Zalgo ERP";

// ── Email transporter (SuperAdmin ki apni email se) ───────────────────────────
function getSuperAdminTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

// ── SuperAdmin ko email bhejo ─────────────────────────────────────────────────
async function notifySuperAdminByEmail(
  subject: string,
  html: string,
): Promise<void> {
  const transporter = getSuperAdminTransporter();
  if (!transporter) {
    console.warn("[SuperAdmin Notify] EMAIL_USER/EMAIL_PASS not set");
    return;
  }
  try {
    await transporter.sendMail({
      from: `"${APP_NAME} System" <${process.env.EMAIL_USER}>`,
      to: SUPERADMIN_EMAIL,
      subject,
      html,
    });
    console.log(`[SuperAdmin Notify] Email sent: ${subject}`);
  } catch (err: any) {
    console.error("[SuperAdmin Notify] Email failed:", err.message);
  }
}

// ── SuperAdmin ko WhatsApp bhejo (via Twilio agar configured ho) ──────────────
async function notifySuperAdminByWhatsApp(message: string): Promise<void> {
  const sid = process.env.SUPERADMIN_TWILIO_SID;
  const token = process.env.SUPERADMIN_TWILIO_TOKEN;
  const from = process.env.SUPERADMIN_TWILIO_WHATSAPP;
  if (!sid || !token || !from) return;

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(sid, token);
    await client.messages.create({
      body: message,
      from,
      to: `whatsapp:${SUPERADMIN_WHATSAPP}`,
    });
    console.log("[SuperAdmin Notify] WhatsApp sent");
  } catch (err: any) {
    console.error("[SuperAdmin Notify] WhatsApp failed:", err.message);
  }
}

// ── Admin ko email bhejo (welcome / plan expiry warning) ──────────────────────
async function notifyAdminByEmail(
  adminEmail: string,
  subject: string,
  html: string,
): Promise<void> {
  const transporter = getSuperAdminTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject,
      html,
    });
    console.log(`[Admin Notify] Email sent to ${adminEmail}: ${subject}`);
  } catch (err: any) {
    console.error("[Admin Notify] Email failed:", err.message);
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────
function wrapHtml(content: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9fafb;border-radius:12px">
      <div style="background:#0f766e;padding:16px 20px;border-radius:8px;margin-bottom:20px">
        <h2 style="color:white;margin:0;font-size:18px">${APP_NAME}</h2>
      </div>
      ${content}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#9ca3af;font-size:12px;text-align:center">This is an automated message from ${APP_NAME}</p>
    </div>
  `;
}

// ── 1. New Admin Registration ─────────────────────────────────────────────────
export async function notifyNewRegistration(admin: {
  name: string;
  email: string;
  id: number;
}): Promise<void> {
  const subject = `🎉 New Registration: ${admin.name}`;
  const html = wrapHtml(`
    <h3 style="color:#111827">New Admin Registered</h3>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px;color:#6b7280;width:120px">Name:</td><td style="padding:8px;font-weight:600">${admin.name}</td></tr>
      <tr><td style="padding:8px;color:#6b7280">Email:</td><td style="padding:8px">${admin.email}</td></tr>
      <tr><td style="padding:8px;color:#6b7280">Admin ID:</td><td style="padding:8px">#${admin.id}</td></tr>
      <tr><td style="padding:8px;color:#6b7280">Time:</td><td style="padding:8px">${new Date().toLocaleString("en-IN")}</td></tr>
    </table>
    <a href="https://erp.zalgostore.com/superadmin" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0f766e;color:white;border-radius:8px;text-decoration:none;font-size:14px">View in SuperAdmin Panel</a>
  `);

  const whatsappMsg = `🎉 *New Registration on ${APP_NAME}*\n\n👤 Name: ${admin.name}\n📧 Email: ${admin.email}\n🆔 ID: #${admin.id}\n⏰ Time: ${new Date().toLocaleString("en-IN")}`;

  await Promise.allSettled([
    notifySuperAdminByEmail(subject, html),
    notifySuperAdminByWhatsApp(whatsappMsg),
  ]);

  // Welcome email to the new admin
  const welcomeHtml = wrapHtml(`
    <h3 style="color:#111827">Welcome to ${APP_NAME}! 🎉</h3>
    <p style="color:#374151">Hello <strong>${admin.name}</strong>,</p>
    <p style="color:#374151">Your account has been created successfully. You can now log in and start managing your institute.</p>
    <a href="https://erp.zalgostore.com/login" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0f766e;color:white;border-radius:8px;text-decoration:none;font-size:14px">Login to Dashboard</a>
    <p style="color:#6b7280;margin-top:16px;font-size:13px">Need help? Contact us at ${SUPERADMIN_EMAIL}</p>
  `);
  await notifyAdminByEmail(admin.email, `Welcome to ${APP_NAME}!`, welcomeHtml);
}

// ── 2. Plan Expiry Warning (7 days before) ────────────────────────────────────
export async function notifyPlanExpiryWarning(admin: {
  name: string;
  email: string;
  id: number;
  planName: string;
  expiryDate: Date;
  daysLeft: number;
}): Promise<void> {
  const subject = `⚠️ Plan Expiring in ${admin.daysLeft} days — ${admin.name}`;
  const html = wrapHtml(`
    <h3 style="color:#111827">Subscription Expiring Soon</h3>
    <p style="color:#374151">The following admin's plan is expiring soon:</p>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px;color:#6b7280;width:120px">Admin:</td><td style="padding:8px;font-weight:600">${admin.name}</td></tr>
      <tr><td style="padding:8px;color:#6b7280">Email:</td><td style="padding:8px">${admin.email}</td></tr>
      <tr><td style="padding:8px;color:#6b7280">Plan:</td><td style="padding:8px">${admin.planName}</td></tr>
      <tr><td style="padding:8px;color:#6b7280">Expires:</td><td style="padding:8px;color:#dc2626;font-weight:600">${admin.expiryDate.toLocaleDateString("en-IN")} (${admin.daysLeft} days left)</td></tr>
    </table>
    <a href="https://erp.zalgostore.com/superadmin" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#dc2626;color:white;border-radius:8px;text-decoration:none;font-size:14px">Take Action in SuperAdmin</a>
  `);

  // Also notify the admin to renew
  const adminHtml = wrapHtml(`
    <h3 style="color:#111827">⚠️ Your Plan is Expiring Soon</h3>
    <p style="color:#374151">Hello <strong>${admin.name}</strong>,</p>
    <p style="color:#374151">Your <strong>${admin.planName}</strong> plan on ${APP_NAME} will expire on <strong style="color:#dc2626">${admin.expiryDate.toLocaleDateString("en-IN")}</strong> — that's only <strong>${admin.daysLeft} days away!</strong></p>
    <p style="color:#374151">Renew your plan to continue using all features without interruption.</p>
    <a href="https://erp.zalgostore.com/pricing" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0f766e;color:white;border-radius:8px;text-decoration:none;font-size:14px">Renew Plan Now</a>
    <p style="color:#6b7280;margin-top:16px;font-size:13px">Questions? Contact us at ${SUPERADMIN_EMAIL} or WhatsApp: ${SUPERADMIN_WHATSAPP}</p>
  `);

  const whatsappMsg = `⚠️ *Plan Expiry Warning*\n\n👤 Admin: ${admin.name}\n📧 ${admin.email}\n📋 Plan: ${admin.planName}\n📅 Expires: ${admin.expiryDate.toLocaleDateString("en-IN")}\n⏳ Days left: ${admin.daysLeft}`;

  await Promise.allSettled([
    notifySuperAdminByEmail(subject, html),
    notifySuperAdminByWhatsApp(whatsappMsg),
    notifyAdminByEmail(
      admin.email,
      `⚠️ Your ${APP_NAME} plan expires in ${admin.daysLeft} days`,
      adminHtml,
    ),
  ]);
}

// ── 3. Plan Expired ───────────────────────────────────────────────────────────
export async function notifyPlanExpired(admin: {
  name: string;
  email: string;
  id: number;
  planName: string;
}): Promise<void> {
  const subject = `❌ Plan Expired — ${admin.name}`;
  const html = wrapHtml(`
    <h3 style="color:#111827">Subscription Expired</h3>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px;color:#6b7280;width:120px">Admin:</td><td style="padding:8px;font-weight:600">${admin.name}</td></tr>
      <tr><td style="padding:8px;color:#6b7280">Email:</td><td style="padding:8px">${admin.email}</td></tr>
      <tr><td style="padding:8px;color:#6b7280">Plan:</td><td style="padding:8px">${admin.planName}</td></tr>
      <tr><td style="padding:8px;color:#6b7280">Status:</td><td style="padding:8px;color:#dc2626;font-weight:600">EXPIRED</td></tr>
    </table>
  `);

  const adminHtml = wrapHtml(`
    <h3 style="color:#dc2626">❌ Your Plan Has Expired</h3>
    <p style="color:#374151">Hello <strong>${admin.name}</strong>,</p>
    <p style="color:#374151">Your <strong>${admin.planName}</strong> plan on ${APP_NAME} has expired. Your account access is now limited.</p>
    <p style="color:#374151">Please renew your plan immediately to restore full access.</p>
    <a href="https://erp.zalgostore.com/pricing" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#dc2626;color:white;border-radius:8px;text-decoration:none;font-size:14px">Renew Plan Now</a>
    <p style="color:#6b7280;margin-top:16px;font-size:13px">Need help? Contact: ${SUPERADMIN_EMAIL} | WhatsApp: ${SUPERADMIN_WHATSAPP}</p>
  `);

  await Promise.allSettled([
    notifySuperAdminByEmail(subject, html),
    notifyAdminByEmail(
      admin.email,
      `❌ Your ${APP_NAME} plan has expired — Renew now`,
      adminHtml,
    ),
  ]);
}
