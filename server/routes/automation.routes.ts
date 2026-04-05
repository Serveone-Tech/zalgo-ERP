// server/routes/automation.routes.ts  — NEW FILE
import { Router } from "express";
import { AutomationController } from "../controllers/automation.controller";
import { requireAuth, requireAdmin } from "../controllers/auth.controller";

const router = Router();

// All automation routes require auth
router.get("/lists", requireAuth, AutomationController.getLists);
router.get("/event-types", requireAuth, AutomationController.getEventTypes);
router.get("/stats", requireAuth, AutomationController.getStats);
router.post("/send", requireAuth, requireAdmin, AutomationController.sendCampaign);

export default router;
