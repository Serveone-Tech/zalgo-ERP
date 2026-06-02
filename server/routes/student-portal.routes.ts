import { Router } from "express";
import { requireAuth } from "../controllers/auth.controller";
import { StudentPortalController } from "../controllers/student-portal.controller";

const router = Router();

router.post("/register", StudentPortalController.register);
router.get("/me", requireAuth, StudentPortalController.me);
router.get("/dashboard", requireAuth, StudentPortalController.dashboard);
router.get("/attendance", requireAuth, StudentPortalController.attendance);
router.get("/exams", requireAuth, StudentPortalController.exams);
router.get("/fees", requireAuth, StudentPortalController.feesData);
router.get("/live-classes", requireAuth, StudentPortalController.liveClasses);
router.get("/live-classes/:id/join", requireAuth, StudentPortalController.joinLiveClass);

export default router;
