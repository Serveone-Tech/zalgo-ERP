import { Router } from "express";
import { LeadsController } from "../controllers/leads.controller";

const router = Router();

router.get("/", LeadsController.list);
router.post("/", LeadsController.create);
router.put("/:id", LeadsController.update);
router.delete("/:id", LeadsController.remove);

export default router;
