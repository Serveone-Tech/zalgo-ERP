// server/routes/automation.routes.ts — NEW FILE
import { Router } from "express";
import { requireAuth } from "../controllers/auth.controller";
import { db } from "../db";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "@shared/schema";

// ── Inline tables (add to schema.ts later via db:push) ───────────────────────
export const automationCredentials = pgTable("automation_credentials", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .references(() => users.id)
    .notNull(),
  channel: text("channel").notNull(), // email | sms | whatsapp
  config: text("config").notNull(), // JSON string (encrypted in future)
  enabled: boolean("enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const automationTriggers = pgTable("automation_triggers", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .references(() => users.id)
    .notNull(),
  triggerId: text("trigger_id").notNull(),
  enabled: boolean("enabled").default(false),
  channels: text("channels").array().default([]),
  template: text("template"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

const router = Router();

function getAdminId(req: any): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

// ── GET credentials ───────────────────────────────────────────────────────────
router.get("/credentials", requireAuth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const rows = await db
      .select()
      .from(automationCredentials)
      .where(eq(automationCredentials.adminId, adminId));

    const result: Record<string, any> = {};
    for (const row of rows) {
      try {
        const config = JSON.parse(row.config);
        // Mask sensitive keys before sending to frontend
        const masked = maskCredentials(config);
        result[row.channel] = { ...masked, enabled: row.enabled };
      } catch {}
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT credentials ───────────────────────────────────────────────────────────
router.put("/credentials", requireAuth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const schema = z.object({
      channel: z.enum(["email", "sms", "whatsapp"]),
      config: z.object({
        enabled: z.boolean(),
        // Email
        sendgridApiKey: z.string().optional(),
        fromEmail: z.string().optional(),
        fromName: z.string().optional(),
        // SMS / WhatsApp
        twilioAccountSid: z.string().optional(),
        twilioAuthToken: z.string().optional(),
        twilioPhoneNumber: z.string().optional(),
        twilioWhatsappNumber: z.string().optional(),
      }),
    });

    const { channel, config } = schema.parse(req.body);
    const { enabled, ...rest } = config;
    const configStr = JSON.stringify(rest);

    // Upsert
    const existing = await db
      .select()
      .from(automationCredentials)
      .where(
        and(
          eq(automationCredentials.adminId, adminId),
          eq(automationCredentials.channel, channel),
        ),
      );

    if (existing.length > 0) {
      await db
        .update(automationCredentials)
        .set({ config: configStr, enabled, updatedAt: new Date() })
        .where(
          and(
            eq(automationCredentials.adminId, adminId),
            eq(automationCredentials.channel, channel),
          ),
        );
    } else {
      await db
        .insert(automationCredentials)
        .values({ adminId, channel, config: configStr, enabled });
    }

    res.json({ success: true, message: `${channel} credentials saved` });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: err.errors[0].message });
    res.status(500).json({ message: err.message });
  }
});

// ── GET triggers ──────────────────────────────────────────────────────────────
router.get("/triggers", requireAuth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const rows = await db
      .select()
      .from(automationTriggers)
      .where(eq(automationTriggers.adminId, adminId));

    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.triggerId] = {
        enabled: row.enabled,
        channels: row.channels || [],
        template: row.template || "",
      };
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT triggers ──────────────────────────────────────────────────────────────
router.put("/triggers", requireAuth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const schema = z.object({
      triggerId: z.string(),
      config: z.object({
        enabled: z.boolean(),
        channels: z.array(z.string()),
        template: z.string().optional(),
      }),
    });

    const { triggerId, config } = schema.parse(req.body);

    const existing = await db
      .select()
      .from(automationTriggers)
      .where(
        and(
          eq(automationTriggers.adminId, adminId),
          eq(automationTriggers.triggerId, triggerId),
        ),
      );

    if (existing.length > 0) {
      await db
        .update(automationTriggers)
        .set({
          enabled: config.enabled,
          channels: config.channels,
          template: config.template || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(automationTriggers.adminId, adminId),
            eq(automationTriggers.triggerId, triggerId),
          ),
        );
    } else {
      await db.insert(automationTriggers).values({
        adminId,
        triggerId,
        enabled: config.enabled,
        channels: config.channels,
        template: config.template || null,
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: err.errors[0].message });
    res.status(500).json({ message: err.message });
  }
});

// ── POST manual send ──────────────────────────────────────────────────────────
router.post("/send", requireAuth, async (req, res) => {
  try {
    const adminId = getAdminId(req);
    const schema = z.object({
      channel: z.enum(["email", "sms", "whatsapp"]),
      to: z.string().min(1),
      subject: z.string().optional(),
      message: z.string().min(1),
    });

    const { channel, to, subject, message } = schema.parse(req.body);

    // Get credentials for this admin
    const [credRow] = await db
      .select()
      .from(automationCredentials)
      .where(
        and(
          eq(automationCredentials.adminId, adminId),
          eq(automationCredentials.channel, channel),
        ),
      );

    if (!credRow || !credRow.enabled) {
      return res
        .status(400)
        .json({ message: `${channel} channel is not configured or disabled` });
    }

    const creds = JSON.parse(credRow.config);
    const result = await sendMessage({ channel, to, subject, message, creds });

    if (!result.success) {
      return res
        .status(500)
        .json({ message: result.error || "Failed to send message" });
    }

    res.json({ success: true, message: "Message sent successfully" });
  } catch (err: any) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: err.errors[0].message });
    res.status(500).json({ message: err.message });
  }
});

// ── Send message helper ───────────────────────────────────────────────────────
async function sendMessage({
  channel,
  to,
  subject,
  message,
  creds,
}: {
  channel: string;
  to: string;
  subject?: string;
  message: string;
  creds: any;
}): Promise<{ success: boolean; error?: string }> {
  if (channel === "email") {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        auth: {
          user: "apikey",
          pass: creds.sendgridApiKey,
        },
      });
      await transporter.sendMail({
        from: creds.fromName
          ? `"${creds.fromName}" <${creds.fromEmail}>`
          : creds.fromEmail,
        to,
        subject: subject || "Message from your institute",
        text: message,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
          <p>${message.replace(/\n/g, "<br>")}</p>
        </div>`,
      });
      return { success: true };
    } catch (err: any) {
      console.error("[Automation Email]", err.message);
      return { success: false, error: err.message };
    }
  }

  if (channel === "sms" || channel === "whatsapp") {
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(creds.twilioAccountSid, creds.twilioAuthToken);

      const from =
        channel === "whatsapp"
          ? creds.twilioWhatsappNumber // format: whatsapp:+14155238886
          : creds.twilioPhoneNumber;

      const toFormatted =
        channel === "whatsapp"
          ? `whatsapp:${to.startsWith("+") ? to : "+" + to}`
          : to;

      await client.messages.create({
        body: message,
        from,
        to: toFormatted,
      });
      return { success: true };
    } catch (err: any) {
      console.error("[Automation Twilio]", err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: "Unknown channel" };
}

// ── Mask sensitive keys ───────────────────────────────────────────────────────
function maskCredentials(config: any): any {
  const mask = (val: string) => (val ? val.substring(0, 6) + "••••••••" : "");
  return {
    ...config,
    sendgridApiKey: config.sendgridApiKey
      ? mask(config.sendgridApiKey)
      : undefined,
    twilioAuthToken: config.twilioAuthToken
      ? mask(config.twilioAuthToken)
      : undefined,
    // Keep these visible
    fromEmail: config.fromEmail,
    fromName: config.fromName,
    twilioAccountSid: config.twilioAccountSid,
    twilioPhoneNumber: config.twilioPhoneNumber,
    twilioWhatsappNumber: config.twilioWhatsappNumber,
  };
}

export default router;
