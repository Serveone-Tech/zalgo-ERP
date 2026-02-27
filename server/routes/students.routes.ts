import { Router } from "express";
import { StudentsController } from "../controllers/students.controller";
import { requireAuth } from "../controllers/auth.controller";

const router = Router();
router.get("/", requireAuth, StudentsController.list);
router.get("/:id", requireAuth, StudentsController.get);
router.post("/", requireAuth, StudentsController.create);
router.put("/:id", requireAuth, StudentsController.update);
router.delete("/:id", requireAuth, StudentsController.remove);
export default router;
