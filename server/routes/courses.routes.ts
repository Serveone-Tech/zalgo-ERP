import { Router } from "express";
import { CoursesController } from "../controllers/courses.controller";
import { requireAuth, requirePermission } from "../controllers/auth.controller";

const router = Router();
const perm = requirePermission("courses");
router.get("/", requireAuth, perm, CoursesController.list);
router.get("/:id", requireAuth, perm, CoursesController.get);
router.get("/:id/students", requireAuth, perm, CoursesController.students);
router.post("/", requireAuth, perm, CoursesController.create);
router.put("/:id", requireAuth, perm, CoursesController.update);
router.delete("/:id", requireAuth, perm, CoursesController.remove);
export default router;
