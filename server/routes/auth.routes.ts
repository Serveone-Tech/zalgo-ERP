import { Router } from "express";
import { AuthController, requireAuth, requireAdmin } from "../controllers/auth.controller";

const router = Router();

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", AuthController.me);

// User management (admin only)
router.get("/users", requireAuth, requireAdmin, AuthController.listUsers);
router.post("/users", requireAuth, requireAdmin, AuthController.createUser);
router.put("/users/:id", requireAuth, requireAdmin, AuthController.updateUser);
router.delete("/users/:id", requireAuth, requireAdmin, AuthController.deleteUser);

export default router;
