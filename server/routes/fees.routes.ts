import { Router } from "express";
import { FeesController } from "../controllers/fees.controller";
import { requireAuth, requirePermission } from "../controllers/auth.controller";

const router = Router();
const perm = requirePermission("fees");
router.get("/", requireAuth, perm, FeesController.list);
router.post("/", requireAuth, perm, FeesController.create);
router.delete("/:id", requireAuth, perm, FeesController.remove);
export default router;
