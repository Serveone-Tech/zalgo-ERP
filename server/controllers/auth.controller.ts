import type { Request, Response } from "express";
import { sendOtpEmail } from "../utils/email.service";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { z } from "zod";
import crypto from "crypto";
import {
  upsertKlaviyoProfile,
  trackKlaviyoEvent,
  KLAVIYO_EVENTS,
} from "../utils/klaviyo.service";
import { db } from "../db";
import { users, organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

const ROLES = ["admin", "staff", "accountant", "teacher"] as const;

// In-memory OTP store: email → { otp, expiry }
const otpStore = new Map<string, { otp: string; expiry: Date }>();
// In-memory reset token store: token → { email, expiry }
const resetTokenStore = new Map<string, { email: string; expiry: Date }>();

export const AuthController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await storage.getUserByEmail(email);
    if (!user || !user.isActive)
      return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userBranchId = user.branchId;
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    req.session.userPermissions = user.permissions ?? [];
    (req.session as any).adminId = (user as any).adminId ?? user.id;
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  },

  async logout(req: Request, res: Response) {
    req.session.destroy(() => {});
    res.json({ message: "Logged out" });
  },

  async me(req: Request, res: Response) {
    if (!req.session.userId)
      return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  },

  // Forgot password: send OTP
  // Forgot password: send OTP
  async forgotPassword(req: Request, res: Response) {
    const schema = z.object({ email: z.string().email() });
    try {
      const { email } = schema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.json({
          message: "If this email is registered, an OTP has been sent.",
        });
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      otpStore.set(email.toLowerCase(), { otp, expiry });

      console.log(`[OTP] ${email}: ${otp}`);

      // Send email — non-blocking, don't throw if fails
      sendOtpEmail(email, otp, user.name).catch((e) =>
        console.error("[OTP Email] Failed:", e.message),
      );

      // Always respond immediately — don't await email
      return res.json({
        message: "If this email is registered, an OTP has been sent.",
      });
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  // Verify OTP and return a reset token
  async verifyOtp(req: Request, res: Response) {
    const schema = z.object({
      email: z.string().email(),
      otp: z.string().length(6),
    });
    try {
      const { email, otp } = schema.parse(req.body);
      const record = otpStore.get(email.toLowerCase());
      if (!record || record.otp !== otp || record.expiry < new Date()) {
        return res
          .status(400)
          .json({ message: "Invalid or expired OTP. Please try again." });
      }
      otpStore.delete(email.toLowerCase());
      const token = crypto.randomBytes(32).toString("hex");
      resetTokenStore.set(token, {
        email: email.toLowerCase(),
        expiry: new Date(Date.now() + 15 * 60 * 1000),
      });
      res.json({ resetToken: token });
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  // Reset password using the token from verifyOtp
  async resetPasswordWithToken(req: Request, res: Response) {
    const schema = z.object({
      resetToken: z.string(),
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
    });
    try {
      const { resetToken, newPassword } = schema.parse(req.body);
      const record = resetTokenStore.get(resetToken);
      if (!record || record.expiry < new Date()) {
        return res.status(400).json({
          message: "Reset link has expired. Please request a new OTP.",
        });
      }
      const user = await storage.getUserByEmail(record.email);
      if (!user) return res.status(404).json({ message: "User not found." });
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { passwordHash } as any);
      resetTokenStore.delete(resetToken);
      res.json({ message: "Password reset successfully. You can now log in." });
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  // Change password for logged-in user
  async changePassword(req: Request, res: Response) {
    if (!req.session.userId)
      return res.status(401).json({ message: "Not authenticated" });
    const schema = z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z
        .string()
        .min(6, "New password must be at least 6 characters"),
    });
    try {
      const { currentPassword, newPassword } = schema.parse(req.body);
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid)
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { passwordHash } as any);
      res.json({ message: "Password changed successfully." });
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  // User management (admin only)
  async listUsers(req: Request, res: Response) {
    const adminId = (req.session as any).adminId ?? req.session.userId;
    const users = await storage.getUsers(adminId);
    res.json(users);
  },

  async createUser(req: Request, res: Response) {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(ROLES),
      permissions: z.array(z.string()).optional().default([]),
      branchId: z.number().optional().nullable(),
      isActive: z.boolean().optional().default(true),
    });
    try {
      const data = schema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing)
        return res.status(400).json({ message: "Email already in use" });

      const passwordHash = await bcrypt.hash(data.password, 10);
      const adminId = (req.session as any).adminId ?? req.session.userId;
      const user = await storage.createUser({
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        permissions: data.permissions,
        branchId: data.branchId ?? null,
        isActive: data.isActive,
        adminId, // ← sub-user ko admin se link karo
      } as any);
      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  async updateUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    const schema = z.object({
      name: z.string().optional(),
      role: z.enum(ROLES).optional(),
      permissions: z.array(z.string()).optional(),
      branchId: z.number().optional().nullable(),
      isActive: z.boolean().optional(),
      password: z.string().min(6).optional(),
    });
    try {
      const data = schema.parse(req.body);
      const updates: any = { ...data };
      if (data.password) {
        updates.passwordHash = await bcrypt.hash(data.password, 10);
        delete updates.password;
      }
      const user = await storage.updateUser(id, updates);
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  async deleteUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (id === req.session.userId)
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    await storage.deleteUser(id);
    res.status(204).send();
  },

  // ── NEW: Public registration ──────────────────────────────────────────────
  async register(req: Request, res: Response) {
    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      phone: z.string().min(10, "Phone number must be at least 10 digits"),
      address: z.string().optional(),
      password: z.string().min(6, "Password must be at least 6 characters"),
    });
    try {
      const data = schema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res
          .status(400)
          .json({ message: "An account with this email already exists" });
      }
      const passwordHash = await bcrypt.hash(data.password, 10);
      await storage.createUser({
        name: data.name,
        email: data.email,
        passwordHash,
        role: "admin",
        permissions: [],
        branchId: null,
        isActive: true,
        isOnboarded: false,
      } as any);
      res.status(201).json({ message: "Account created successfully" });
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  // ── NEW: Post-payment onboarding — save org details ───────────────────────
  async onboarding(req: Request, res: Response) {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const schema = z.object({
      name: z.string().min(2, "Organization name is required"),
      logo: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      website: z.string().optional(),
      type: z.string().optional(),
      boardAffiliation: z.string().optional(),
      principalName: z.string().optional(),
      establishedYear: z.string().optional(),
    });

    try {
      const data = schema.parse(req.body);

      await db.insert(organizations).values({
        userId,
        ...data,
        email: data.email || null,
      });

      await db
        .update(users)
        .set({ isOnboarded: true } as any)
        .where(eq(users.id, userId));

      // Track in Klaviyo (non-blocking)
      try {
        const user = await storage.getUser(userId);
        if (user) {
          await upsertKlaviyoProfile({
            email: user.email,
            firstName: user.name,
            properties: {
              organizationName: data.name,
              type: data.type,
              city: data.city,
            },
          });
          await trackKlaviyoEvent(user.email, KLAVIYO_EVENTS.USER_REGISTERED, {
            organizationName: data.name,
            city: data.city,
            type: data.type,
          });
        }
      } catch (e) {
        console.warn("[Onboarding] Klaviyo tracking failed:", e);
      }

      res.json({ message: "Organization setup complete", isOnboarded: true });
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },
};

// ── Middleware ────────────────────────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: any) {
  if (!req.session.userId)
    return res.status(401).json({ message: "Authentication required" });
  next();
}

export function requireAdmin(req: Request, res: Response, next: any) {
  if (!req.session.userId)
    return res.status(401).json({ message: "Authentication required" });
  if (
    req.session.userRole !== "admin" &&
    req.session.userRole !== "superadmin"
  ) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: any) {
  if (!req.session.userId)
    return res.status(401).json({ message: "Authentication required" });
  if (req.session.userRole !== "superadmin") {
    return res.status(403).json({ message: "SuperAdmin access required" });
  }
  next();
}

// Maps HTTP method to permission action
function methodToAction(method: string): "read" | "write" | "delete" {
  if (method === "DELETE") return "delete";
  if (method === "GET") return "read";
  return "write";
}

function hasPermission(
  permissions: string[],
  module: string,
  action: "read" | "write" | "delete",
): boolean {
  if (permissions.includes(`${module}:${action}`)) return true;
  if (action === "read" && permissions.includes(module)) return true;
  return false;
}

export function requirePermission(module: string) {
  return (req: Request, res: Response, next: any) => {
    if (!req.session.userId)
      return res.status(401).json({ message: "Authentication required" });
    if (
      req.session.userRole === "admin" ||
      req.session.userRole === "superadmin"
    )
      return next();
    const action = methodToAction(req.method);
    const permissions = req.session.userPermissions ?? [];
    if (!hasPermission(permissions, module, action)) {
      return res.status(403).json({
        message: `Access denied: you do not have ${action} permission for '${module}'.`,
      });
    }
    next();
  };
}
