import { Router } from "express";
import { FeesController } from "../controllers/fees.controller";

const router = Router();

router.get("/", FeesController.list);
router.post("/", FeesController.create);
router.delete("/:id", FeesController.remove);

export default router;
