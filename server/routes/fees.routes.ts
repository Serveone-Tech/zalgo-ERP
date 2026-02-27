import { Router } from "express";
import { FeesController } from "../controllers/fees.controller";
import { requireAuth } from "../controllers/auth.controller";

const router = Router();
router.get("/", requireAuth, FeesController.list);
router.post("/", requireAuth, FeesController.create);
router.delete("/:id", requireAuth, FeesController.remove);
export default router;
