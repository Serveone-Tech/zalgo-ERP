import { Router } from "express";
import { ReportCardController } from "../controllers/report-card.controller";
import { requireAuth } from "../controllers/auth.controller";

const router = Router();

// ── Report Card (full data) ───────────────────────────────────────────────────
router.get("/:studentId", requireAuth, ReportCardController.getReportCard);

// ── Attendance ────────────────────────────────────────────────────────────────
router.post("/attendance", requireAuth, ReportCardController.addAttendance);
router.delete(
  "/attendance/:id",
  requireAuth,
  ReportCardController.deleteAttendance,
);

// ── Homework ──────────────────────────────────────────────────────────────────
router.post("/homework", requireAuth, ReportCardController.addHomework);
router.delete(
  "/homework/:id",
  requireAuth,
  ReportCardController.deleteHomework,
);

// ── Test Results ──────────────────────────────────────────────────────────────
router.post("/tests", requireAuth, ReportCardController.addTestResult);
router.delete("/tests/:id", requireAuth, ReportCardController.deleteTestResult);

// ── Remarks ───────────────────────────────────────────────────────────────────
router.post("/remarks", requireAuth, ReportCardController.addRemark);
router.delete("/remarks/:id", requireAuth, ReportCardController.deleteRemark);

// ── Batch History ─────────────────────────────────────────────────────────────
router.post(
  "/batch-history",
  requireAuth,
  ReportCardController.addBatchHistory,
);

export default router;
