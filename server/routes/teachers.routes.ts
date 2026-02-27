import { Router } from "express";
import { TeachersController } from "../controllers/teachers.controller";
import { requireAuth } from "../controllers/auth.controller";

const router = Router();
router.get("/", requireAuth, TeachersController.list);
router.post("/", requireAuth, TeachersController.create);
router.put("/:id", requireAuth, TeachersController.update);
router.delete("/:id", requireAuth, TeachersController.remove);
export default router;
