import { Router } from "express";
import { CoursesController } from "../controllers/courses.controller";

const router = Router();

router.get("/", CoursesController.list);
router.get("/:id/students", CoursesController.students);
router.post("/", CoursesController.create);
router.put("/:id", CoursesController.update);
router.delete("/:id", CoursesController.remove);

export default router;
