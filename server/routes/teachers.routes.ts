import { Router } from "express";
import { TeachersController } from "../controllers/teachers.controller";
import { requireAuth, requirePermission } from "../controllers/auth.controller";

const router = Router();
const perm = requirePermission("teachers");
router.get("/", requireAuth, perm, TeachersController.list);
router.get("/:id", requireAuth, perm, TeachersController.get);
router.post("/", requireAuth, perm, TeachersController.create);
router.put("/:id", requireAuth, perm, TeachersController.update);
router.delete("/:id", requireAuth, perm, TeachersController.remove);
export default router;
