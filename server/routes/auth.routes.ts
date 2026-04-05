
import { Router } from "express";
import {
  AuthController,
  requireAuth,
  requireAdmin,
} from "../controllers/auth.controller";
import { db } from "../db";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", AuthController.me);
router.post("/register", AuthController.register);

// Forgot password / OTP flow
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-otp", AuthController.verifyOtp);
router.post(
  "/reset-password-with-token",
  AuthController.resetPasswordWithToken,
);

// ── Protected routes ──────────────────────────────────────────────────────────
router.post("/change-password", requireAuth, AuthController.changePassword);
router.post("/onboarding", requireAuth, AuthController.onboarding);

// Organization details (for sidebar logo + name)
router.get("/organization", requireAuth, async (req, res) => {
  try {
    const adminId = (req.session as any).adminId ?? req.session.userId;
    if (!adminId) return res.json(null);
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.userId, adminId));
    res.json(org || null);
  } catch {
    res.json(null);
  }
});

// ── Admin only ────────────────────────────────────────────────────────────────
router.get("/users", requireAuth, requireAdmin, AuthController.listUsers);
router.post("/users", requireAuth, requireAdmin, AuthController.createUser);
router.put("/users/:id", requireAuth, requireAdmin, AuthController.updateUser);
router.delete(
  "/users/:id",
  requireAuth,
  requireAdmin,
  AuthController.deleteUser,
);

export default router;
