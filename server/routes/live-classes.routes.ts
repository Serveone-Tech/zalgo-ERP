import { Router } from "express";
import { requireAuth, requireAdmin } from "../controllers/auth.controller";
import { LiveClassesController } from "../controllers/live-classes.controller";

const router = Router();

router.get("/setup-status", requireAuth, LiveClassesController.checkSetup);
router.get("/", requireAuth, LiveClassesController.list);
router.post("/", requireAuth, requireAdmin, LiveClassesController.create);
router.post("/:id/start", requireAuth, requireAdmin, LiveClassesController.start);
router.post("/:id/end", requireAuth, requireAdmin, LiveClassesController.end);
router.post("/:id/cancel", requireAuth, requireAdmin, LiveClassesController.cancel);
router.get("/:id/join", requireAuth, LiveClassesController.join);

export default router;
