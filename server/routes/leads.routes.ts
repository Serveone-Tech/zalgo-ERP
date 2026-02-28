import { Router } from "express";
import { LeadsController } from "../controllers/leads.controller";
import { requireAuth, requirePermission } from "../controllers/auth.controller";

const router = Router();
const perm = requirePermission("leads");
router.get("/", requireAuth, perm, LeadsController.list);
router.get("/:id", requireAuth, perm, LeadsController.get);
router.post("/", requireAuth, perm, LeadsController.create);
router.put("/:id", requireAuth, perm, LeadsController.update);
router.delete("/:id", requireAuth, perm, LeadsController.remove);
export default router;
