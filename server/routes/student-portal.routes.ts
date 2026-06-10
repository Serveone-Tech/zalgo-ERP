import { Router } from "express";
import { requireAuth } from "../controllers/auth.controller";
import { StudentPortalController } from "../controllers/student-portal.controller";
import { db } from "../db";
import { onlineExams, examQuestions, examAttempts, students } from "@shared/schema";
import { eq, and, lte, gte, or, isNull } from "drizzle-orm";

const router = Router();

router.post("/register", StudentPortalController.register);
router.get("/me", requireAuth, StudentPortalController.me);
router.get("/dashboard", requireAuth, StudentPortalController.dashboard);
router.get("/attendance", requireAuth, StudentPortalController.attendance);
router.get("/exams", requireAuth, StudentPortalController.exams);
router.get("/fees", requireAuth, StudentPortalController.feesData);
router.get("/live-classes", requireAuth, StudentPortalController.liveClasses);
router.get("/live-classes/:id/join", requireAuth, StudentPortalController.joinLiveClass);

// ── Online Exams (student portal) ─────────────────────────────────────────────

// Helper: get student record (with adminId) from session user
async function getStudentFromSession(req: any) {
  const userId = (req.session as any).userId;
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.userId as any, userId));
  return student ?? null;
}

// Helper: build exam filter that also gates by the student's admin
function examVisibleFilter(adminId: number, examId?: number) {
  const conditions: any[] = [
    eq(onlineExams.status, "published"),
    eq(onlineExams.adminId, adminId),   // ← KEY: only this admin's exams
  ];
  if (examId !== undefined) conditions.push(eq(onlineExams.id, examId));
  return and(...conditions);
}

// List published exams for this student's admin — with attempt status
router.get("/online-exams", requireAuth, async (req, res) => {
  const student = await getStudentFromSession(req);
  if (!student) return res.status(403).json({ message: "Student not found" });
  if (!student.adminId) return res.json([]);

  const now = new Date();
  const exams = await db
    .select()
    .from(onlineExams)
    .where(examVisibleFilter(student.adminId));

  // Filter to active schedule window
  const available = exams.filter((e) => {
    const afterScheduled = !e.scheduledAt || e.scheduledAt <= now;
    const beforeExpiry = !e.expiresAt || e.expiresAt >= now;
    return afterScheduled && beforeExpiry;
  });

  const examIds = available.map((e) => e.id);
  let attempts: typeof examAttempts.$inferSelect[] = [];
  if (examIds.length > 0) {
    attempts = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.studentId, student.id));
  }

  const attemptMap: Record<number, typeof examAttempts.$inferSelect> = {};
  for (const a of attempts) attemptMap[a.examId] = a;

  res.json(available.map((e) => ({ ...e, attempt: attemptMap[e.id] ?? null })));
});

// Get exam instructions — only if it belongs to this student's admin
router.get("/online-exams/:id", requireAuth, async (req, res) => {
  const examId = Number(req.params.id);
  const student = await getStudentFromSession(req);
  if (!student) return res.status(403).json({ message: "Student not found" });
  if (!student.adminId) return res.status(404).json({ message: "Exam not found" });

  const [exam] = await db
    .select()
    .from(onlineExams)
    .where(examVisibleFilter(student.adminId, examId));

  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const [existing] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, student.id)));

  res.json({ exam, attempt: existing ?? null });
});

// Start exam (create attempt)
router.post("/online-exams/:id/start", requireAuth, async (req, res) => {
  const examId = Number(req.params.id);
  const student = await getStudentFromSession(req);
  if (!student) return res.status(403).json({ message: "Student not found" });
  if (!student.adminId) return res.status(404).json({ message: "Exam not found" });

  // Only allow starting exams that belong to this student's admin
  const [exam] = await db
    .select()
    .from(onlineExams)
    .where(examVisibleFilter(student.adminId, examId));
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  // Check if already attempted
  const [existing] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, student.id)));

  if (existing) {
    if (existing.status !== "in_progress")
      return res.status(409).json({ message: "You have already submitted this exam" });
    // Resume in-progress attempt
    return res.json({ attemptId: existing.id });
  }

  const [attempt] = await db
    .insert(examAttempts)
    .values({
      examId,
      studentId: student.id,
      status: "in_progress",
      answers: "{}",
    })
    .returning();

  res.status(201).json({ attemptId: attempt.id });
});

// Get questions for an in-progress attempt (no correct answers)
router.get("/online-exams/:id/attempt", requireAuth, async (req, res) => {
  const examId = Number(req.params.id);
  const student = await getStudentFromSession(req);
  if (!student) return res.status(403).json({ message: "Student not found" });

  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, student.id)));

  if (!attempt) return res.status(404).json({ message: "No attempt found. Start the exam first." });

  // Verify exam belongs to this student's admin
  const [exam] = await db
    .select()
    .from(onlineExams)
    .where(student.adminId
      ? and(eq(onlineExams.id, examId), eq(onlineExams.adminId, student.adminId))
      : eq(onlineExams.id, examId));
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  // Compute time remaining
  const elapsed = attempt.startedAt
    ? Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000)
    : 0;
  const totalSecs = exam.durationMinutes * 60;
  const remainingSecs = Math.max(0, totalSecs - elapsed);

  if (attempt.status !== "in_progress") {
    return res.json({ attempt, questions: [], remainingSecs: 0, exam });
  }

  const questions = await db
    .select({
      id: examQuestions.id,
      question: examQuestions.question,
      optionA: examQuestions.optionA,
      optionB: examQuestions.optionB,
      optionC: examQuestions.optionC,
      optionD: examQuestions.optionD,
      orderIndex: examQuestions.orderIndex,
    })
    .from(examQuestions)
    .where(eq(examQuestions.examId, examId))
    .orderBy(examQuestions.orderIndex);

  const answers: Record<number, string> = JSON.parse(attempt.answers || "{}");

  res.json({ attempt, questions, answers, remainingSecs, exam });
});

// Save answers (auto-save during exam)
router.post("/online-exams/:id/save", requireAuth, async (req, res) => {
  const examId = Number(req.params.id);
  const student = await getStudentFromSession(req);
  if (!student) return res.status(403).json({ message: "Student not found" });

  const { answers } = req.body;
  if (!answers || typeof answers !== "object")
    return res.status(400).json({ message: "answers required" });

  await db
    .update(examAttempts)
    .set({ answers: JSON.stringify(answers) })
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, student.id), eq(examAttempts.status, "in_progress")));

  res.json({ ok: true });
});

// Submit exam
router.post("/online-exams/:id/submit", requireAuth, async (req, res) => {
  const examId = Number(req.params.id);
  const student = await getStudentFromSession(req);
  if (!student) return res.status(403).json({ message: "Student not found" });

  const { answers, autoSubmit } = req.body;

  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, student.id)));

  if (!attempt) return res.status(404).json({ message: "No attempt found" });
  if (attempt.status !== "in_progress")
    return res.status(409).json({ message: "Exam already submitted" });

  // Verify exam belongs to this student's admin
  const [exam] = await db
    .select()
    .from(onlineExams)
    .where(student.adminId
      ? and(eq(onlineExams.id, examId), eq(onlineExams.adminId, student.adminId))
      : eq(onlineExams.id, examId));
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const questions = await db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, examId));

  const finalAnswers: Record<number, string> = answers
    ? typeof answers === "string"
      ? JSON.parse(answers)
      : answers
    : JSON.parse(attempt.answers || "{}");

  const negVal = parseFloat(exam.negativeMarkValue || "1");
  const mPerQ = exam.marksPerQuestion;
  let obtained = 0;
  let correct = 0;
  let wrong = 0;

  for (const q of questions) {
    const selected = finalAnswers[q.id];
    if (!selected) continue;
    if (selected === q.correctOption) {
      obtained += mPerQ;
      correct++;
    } else if (exam.negativeMarking) {
      obtained -= negVal;
      wrong++;
    }
  }

  obtained = Math.max(0, obtained);
  const totalMarks = questions.length * mPerQ;
  const percentage = totalMarks > 0 ? Math.round((obtained / totalMarks) * 100) : 0;
  const passed = percentage >= (exam.passingPercent ?? 40);
  const timeSpent = attempt.startedAt
    ? Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000)
    : 0;

  const [updated] = await db
    .update(examAttempts)
    .set({
      status: autoSubmit ? "auto_submitted" : "submitted",
      answers: JSON.stringify(finalAnswers),
      obtainedMarks: obtained,
      totalMarks,
      percentage,
      passed,
      submittedAt: new Date(),
      timeSpentSeconds: timeSpent,
    })
    .where(eq(examAttempts.id, attempt.id))
    .returning();

  // Return with question-level breakdown
  const breakdown = questions.map((q) => ({
    id: q.id,
    question: q.question,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: q.correctOption,
    explanation: q.explanation,
    selected: finalAnswers[q.id] ?? null,
    isCorrect: finalAnswers[q.id] === q.correctOption,
  }));

  res.json({ attempt: updated, breakdown, correct, wrong, skipped: questions.length - correct - wrong });
});

export default router;
