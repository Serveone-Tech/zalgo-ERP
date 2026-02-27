import { Router } from "express";
import { AuthController, requireAuth, requireAdmin } from "../controllers/auth.controller";

const router = Router();

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", AuthController.me);

// Forgot password / OTP flow (public)
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/reset-password-with-token", AuthController.resetPasswordWithToken);

// Change password for logged-in user
router.post("/change-password", requireAuth, AuthController.changePassword);

// User management (admin only)
router.get("/users", requireAuth, requireAdmin, AuthController.listUsers);
router.post("/users", requireAuth, requireAdmin, AuthController.createUser);
router.put("/users/:id", requireAuth, requireAdmin, AuthController.updateUser);
router.delete("/users/:id", requireAuth, requireAdmin, AuthController.deleteUser);

export default router;
