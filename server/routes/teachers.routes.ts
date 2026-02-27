import { Router } from "express";
import { TeachersController } from "../controllers/teachers.controller";

const router = Router();

router.get("/", TeachersController.list);
router.post("/", TeachersController.create);
router.put("/:id", TeachersController.update);
router.delete("/:id", TeachersController.remove);

export default router;
