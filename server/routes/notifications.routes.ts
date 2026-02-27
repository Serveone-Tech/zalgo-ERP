import { Router } from "express";
import { NotificationsController } from "../controllers/notifications.controller";
import { requireAuth } from "../controllers/auth.controller";

const router = Router();
router.get("/", requireAuth, NotificationsController.list);
router.put("/:id/read", requireAuth, NotificationsController.markRead);
router.put("/read-all", requireAuth, NotificationsController.markAllRead);

export default router;
