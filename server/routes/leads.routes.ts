import { Router } from "express";
import { LeadsController } from "../controllers/leads.controller";
import { requireAuth } from "../controllers/auth.controller";

const router = Router();
router.get("/", requireAuth, LeadsController.list);
router.get("/:id", requireAuth, LeadsController.get);
router.post("/", requireAuth, LeadsController.create);
router.put("/:id", requireAuth, LeadsController.update);
router.delete("/:id", requireAuth, LeadsController.remove);
export default router;
