import { Router } from "express";
import { CoursesController } from "../controllers/courses.controller";
import { requireAuth } from "../controllers/auth.controller";

const router = Router();
router.get("/", requireAuth, CoursesController.list);
router.get("/:id/students", requireAuth, CoursesController.students);
router.post("/", requireAuth, CoursesController.create);
router.put("/:id", requireAuth, CoursesController.update);
router.delete("/:id", requireAuth, CoursesController.remove);
export default router;
