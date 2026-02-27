import { Router } from "express";
import { StudentsController } from "../controllers/students.controller";

const router = Router();

router.get("/", StudentsController.list);
router.get("/:id", StudentsController.get);
router.post("/", StudentsController.create);
router.put("/:id", StudentsController.update);
router.delete("/:id", StudentsController.remove);

export default router;
