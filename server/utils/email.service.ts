// server/utils/email.service.ts — REPLACE
import nodemailer from "nodemailer";

// ── Create transporter (matches messaging.service.ts pattern) ─────────────────
function createTransporter() {
  const user = process.env.EMAIL_USER; // Gmail address
  const pass = process.env.EMAIL_PASS; // Gmail App Password

  if (!user || !pass) {
    console.warn("[Email] EMAIL_USER or EMAIL_PASS not set in .env");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail", // gmail shorthand — handles host/port automatically
    auth: { user, pass },
  });
}

// ── Send OTP Email ────────────────────────────────────────────────────────────
export async function sendOtpEmail(
  to: string,
  otp: string,
  userName?: string,
): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[OTP] Email not configured. OTP for ${to}: ${otp}`);
    return false;
  }

  const fromName = process.env.APP_NAME || "Zalgo ERP";
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
      <div style="background: #0f766e; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 22px;">${fromName}</h1>
      </div>
      <h2 style="color: #111827; font-size: 18px; margin-bottom: 8px;">Password Reset OTP</h2>
      <p style="color: #6b7280; margin-bottom: 24px;">
        Hello${userName ? ` ${userName}` : ""},<br/>
        Use the OTP below to reset your password. It is valid for <strong>10 minutes</strong>.
      </p>
      <div style="background: white; border: 2px dashed #0f766e; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0f766e;">${otp}</span>
      </div>
      <p style="color: #9ca3af; font-size: 13px;">
        If you did not request a password reset, please ignore this email. Your account is safe.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">${fromName} · Secure Password Reset</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `${otp} — Your Password Reset OTP`,
      html,
      text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    });
    console.log(`[Email] OTP sent successfully to ${to}`);
    return true;
  } catch (err: any) {
    console.error(`[Email] Failed to send OTP to ${to}:`, err.message);
    return false;
  }
}
