import { Router } from "express";
import { StudentsController } from "../controllers/students.controller";
import { requireAuth, requirePermission } from "../controllers/auth.controller";

const router = Router();
const perm = requirePermission("students");
router.get("/", requireAuth, perm, StudentsController.list);
router.get("/:id", requireAuth, perm, StudentsController.get);
router.post("/", requireAuth, perm, StudentsController.create);
router.put("/:id", requireAuth, perm, StudentsController.update);
router.delete("/:id", requireAuth, perm, StudentsController.remove);
export default router;
