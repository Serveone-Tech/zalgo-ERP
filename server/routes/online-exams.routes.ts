import { Router } from "express";
import { requireAuth, requireAdmin } from "../controllers/auth.controller";
import { db } from "../db";
import {
  onlineExams,
  examQuestions,
  examAttempts,
  students,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// ── AI helpers ────────────────────────────────────────────────────────────────

interface RawQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
}

const LANG_INSTRUCTION: Record<string, string> = {
  English: "Write all questions and options in English.",
  Hindi: "सभी प्रश्न और विकल्प हिंदी में लिखें।",
  Hinglish: "Write questions in a mix of Hindi and English (Hinglish).",
  Gujarati: "બધા પ્રશ્નો અને વિકલ્પો ગુજરાતીમાં લખો.",
  Marathi: "सर्व प्रश्न आणि पर्याय मराठीत लिहा.",
  Bengali: "সমস্ত প্রশ্ন এবং বিকল্পগুলি বাংলায় লিখুন।",
  Tamil: "அனைத்து கேள்விகளையும் விருப்பங்களையும் தமிழில் எழுதுங்கள்.",
  Telugu: "అన్ని ప్రశ్నలు మరియు ఎంపికలు తెలుగులో రాయండి.",
  Kannada: "ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ಆಯ್ಕೆಗಳನ್ನು ಕನ್ನಡದಲ್ಲಿ ಬರೆಯಿರಿ.",
  Urdu: "تمام سوالات اور اختیارات اردو میں لکھیں۔",
  Punjabi: "ਸਾਰੇ ਸਵਾਲ ਅਤੇ ਵਿਕਲਪ ਪੰਜਾਬੀ ਵਿੱਚ ਲਿਖੋ।",
  Sanskrit: "सर्वे प्रश्नाः विकल्पाश्च संस्कृते लिख्यन्ताम्।",
};

async function generateQuestionsAI(
  topic: string,
  count: number,
  language = "English",
): Promise<RawQuestion[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Please add it to your .env file.",
    );
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const langNote = LANG_INSTRUCTION[language] ?? LANG_INSTRUCTION["English"];

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Generate exactly ${count} multiple-choice questions on the topic: "${topic}".
${langNote}

Return ONLY a valid JSON array — no markdown, no explanation text outside the JSON. Each item must follow this exact structure:
{
  "question": "...",
  "optionA": "...",
  "optionB": "...",
  "optionC": "...",
  "optionD": "...",
  "correctOption": "A",
  "explanation": "..."
}

Rules:
- correctOption must be exactly one of: A, B, C, D
- Vary which option is correct across questions
- Questions should be clear, educational, suitable for students
- explanation: 1-2 sentences explaining why the correct answer is right (same language as question)`,
      },
    ],
  });

  const raw =
    msg.content[0].type === "text" ? msg.content[0].text.trim() : "[]";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(cleaned) as RawQuestion[];
}

// ── Admin: list exams ──────────────────────────────────────────────────────────
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const s = req.session as any;
  const adminId = s.adminId ?? s.userId;
  const rows = await db
    .select()
    .from(onlineExams)
    .where(eq(onlineExams.adminId, adminId))
    .orderBy(desc(onlineExams.createdAt));
  res.json(rows);
});

// ── Helper: verify admin owns the exam ────────────────────────────────────────
async function requireExamOwner(req: any, examId: number) {
  const adminId = (req.session as any).adminId ?? (req.session as any).userId;
  const [exam] = await db
    .select()
    .from(onlineExams)
    .where(and(eq(onlineExams.id, examId), eq(onlineExams.adminId, adminId)));
  return exam ?? null;
}

// ── Admin: get one exam with questions ────────────────────────────────────────
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const exam = await requireExamOwner(req, id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const questions = await db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, id))
    .orderBy(examQuestions.orderIndex);

  res.json({ ...exam, questions });
});

// ── Admin: create exam + AI generate questions ────────────────────────────────
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const s = req.session as any;
  const adminId = s.adminId ?? s.userId;

  const {
    title,
    topic,
    description,
    language,
    durationMinutes,
    totalQuestions,
    marksPerQuestion,
    negativeMarking,
    negativeMarkValue,
    passingPercent,
    scheduledAt,
    expiresAt,
  } = req.body;

  if (!title || !topic)
    return res.status(400).json({ message: "Title and topic are required" });

  // 1. Insert exam (draft)
  const [exam] = await db
    .insert(onlineExams)
    .values({
      title,
      topic,
      description: description || null,
      language: language || "English",
      durationMinutes: Number(durationMinutes) || 60,
      totalQuestions: Number(totalQuestions) || 10,
      marksPerQuestion: Number(marksPerQuestion) || 4,
      negativeMarking: Boolean(negativeMarking),
      negativeMarkValue: String(negativeMarkValue || "1"),
      passingPercent: Number(passingPercent) || 40,
      status: "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      adminId,
    })
    .returning();

  // 2. Generate questions via AI (skip if mode is manual)
  if (req.body.mode === "manual") {
    return res.status(201).json({ ...exam, questions: [] });
  }

  let generated: RawQuestion[] = [];
  try {
    generated = await generateQuestionsAI(
      topic,
      Number(totalQuestions) || 10,
      language || "English",
    );
  } catch (err: any) {
    console.error("[AI] question generation failed:", err?.message);
    return res.status(201).json({ ...exam, questions: [], aiError: err?.message });
  }

  // 3. Insert questions
  const questionRows = generated.slice(0, Number(totalQuestions) || 10).map(
    (q, i) => ({
      examId: exam.id,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: (q.correctOption || "A").toUpperCase(),
      explanation: q.explanation || null,
      orderIndex: i,
    }),
  );

  const insertedQuestions = await db
    .insert(examQuestions)
    .values(questionRows)
    .returning();

  res.status(201).json({ ...exam, questions: insertedQuestions });
});

// ── Admin: update exam settings ────────────────────────────────────────────────
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const exam = await requireExamOwner(req, id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const {
    title,
    topic,
    description,
    durationMinutes,
    marksPerQuestion,
    negativeMarking,
    negativeMarkValue,
    passingPercent,
    scheduledAt,
    expiresAt,
  } = req.body;

  const [updated] = await db
    .update(onlineExams)
    .set({
      title,
      topic,
      description,
      durationMinutes: Number(durationMinutes),
      marksPerQuestion: Number(marksPerQuestion),
      negativeMarking: Boolean(negativeMarking),
      negativeMarkValue: String(negativeMarkValue),
      passingPercent: Number(passingPercent),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .where(eq(onlineExams.id, id))
    .returning();

  if (!updated) return res.status(404).json({ message: "Exam not found" });
  res.json(updated);
});

// ── Admin: add a question manually ────────────────────────────────────────────
router.post("/:id/questions", requireAuth, requireAdmin, async (req, res) => {
  const examId = Number(req.params.id);
  if (!await requireExamOwner(req, examId)) return res.status(404).json({ message: "Exam not found" });

  const { question, optionA, optionB, optionC, optionD, correctOption, explanation } = req.body;

  if (!question || !optionA || !optionB || !optionC || !optionD || !correctOption)
    return res.status(400).json({ message: "All fields are required" });

  const existing = await db
    .select({ orderIndex: examQuestions.orderIndex })
    .from(examQuestions)
    .where(eq(examQuestions.examId, examId))
    .orderBy(examQuestions.orderIndex);

  const nextIndex = existing.length > 0 ? existing[existing.length - 1].orderIndex + 1 : 0;

  const [inserted] = await db
    .insert(examQuestions)
    .values({
      examId,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption: correctOption.toUpperCase(),
      explanation: explanation || null,
      orderIndex: nextIndex,
    })
    .returning();

  res.status(201).json(inserted);
});

// ── Admin: delete a single question ────────────────────────────────────────────
router.delete("/:id/questions/:qid", requireAuth, requireAdmin, async (req, res) => {
  const examId = Number(req.params.id);
  if (!await requireExamOwner(req, examId)) return res.status(404).json({ message: "Exam not found" });

  const qid = Number(req.params.qid);
  await db.delete(examQuestions).where(and(eq(examQuestions.id, qid), eq(examQuestions.examId, examId)));
  res.status(204).send();
});

// ── Admin: update a single question ────────────────────────────────────────────
router.put("/:id/questions/:qid", requireAuth, requireAdmin, async (req, res) => {
  const examId = Number(req.params.id);
  if (!await requireExamOwner(req, examId)) return res.status(404).json({ message: "Exam not found" });

  const qid = Number(req.params.qid);
  const { question, optionA, optionB, optionC, optionD, correctOption, explanation } = req.body;

  const [updated] = await db
    .update(examQuestions)
    .set({ question, optionA, optionB, optionC, optionD, correctOption, explanation })
    .where(and(eq(examQuestions.id, qid), eq(examQuestions.examId, examId)))
    .returning();

  res.json(updated);
});

// ── Admin: regenerate questions for an exam ────────────────────────────────────
router.post("/:id/regenerate", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const exam = await requireExamOwner(req, id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  let generated: RawQuestion[] = [];
  try {
    generated = await generateQuestionsAI(exam.topic, exam.totalQuestions, exam.language ?? "English");
  } catch (err: any) {
    return res.status(500).json({ message: "AI generation failed: " + err?.message });
  }

  // Delete old questions
  await db.delete(examQuestions).where(eq(examQuestions.examId, id));

  // Insert new questions
  const questionRows = generated.slice(0, exam.totalQuestions).map((q, i) => ({
    examId: id,
    question: q.question,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: (q.correctOption || "A").toUpperCase(),
    explanation: q.explanation || null,
    orderIndex: i,
  }));

  const inserted = await db.insert(examQuestions).values(questionRows).returning();
  res.json({ message: "Questions regenerated", questions: inserted });
});

// ── Admin: publish exam ────────────────────────────────────────────────────────
router.post("/:id/publish", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!await requireExamOwner(req, id)) return res.status(404).json({ message: "Exam not found" });

  const qCount = await db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, id));

  if (qCount.length === 0)
    return res.status(400).json({ message: "Cannot publish exam without questions" });

  const [updated] = await db
    .update(onlineExams)
    .set({ status: "published" })
    .where(eq(onlineExams.id, id))
    .returning();

  res.json(updated);
});

// ── Admin: unpublish / set back to draft ──────────────────────────────────────
router.post("/:id/unpublish", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!await requireExamOwner(req, id)) return res.status(404).json({ message: "Exam not found" });

  const [updated] = await db
    .update(onlineExams)
    .set({ status: "draft" })
    .where(eq(onlineExams.id, id))
    .returning();
  res.json(updated);
});

// ── Admin: delete exam ─────────────────────────────────────────────────────────
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!await requireExamOwner(req, id)) return res.status(404).json({ message: "Exam not found" });

  await db.delete(examQuestions).where(eq(examQuestions.examId, id));
  await db.delete(examAttempts).where(eq(examAttempts.examId, id));
  await db.delete(onlineExams).where(eq(onlineExams.id, id));
  res.status(204).send();
});

// ── Admin: get all results for an exam ────────────────────────────────────────
router.get("/:id/results", requireAuth, requireAdmin, async (req, res) => {
  const examId = Number(req.params.id);
  if (!await requireExamOwner(req, examId)) return res.status(404).json({ message: "Exam not found" });

  const attempts = await db
    .select({
      attemptId: examAttempts.id,
      studentId: examAttempts.studentId,
      studentName: students.name,
      enrollmentNo: students.enrollmentNo,
      status: examAttempts.status,
      obtainedMarks: examAttempts.obtainedMarks,
      totalMarks: examAttempts.totalMarks,
      percentage: examAttempts.percentage,
      passed: examAttempts.passed,
      startedAt: examAttempts.startedAt,
      submittedAt: examAttempts.submittedAt,
      timeSpentSeconds: examAttempts.timeSpentSeconds,
    })
    .from(examAttempts)
    .leftJoin(students, eq(examAttempts.studentId, students.id))
    .where(eq(examAttempts.examId, examId))
    .orderBy(desc(examAttempts.submittedAt));

  res.json(attempts);
});

// ── Admin: get one student's attempt detail ────────────────────────────────────
router.get("/:id/results/:attemptId", requireAuth, requireAdmin, async (req, res) => {
  const examId = Number(req.params.id);
  if (!await requireExamOwner(req, examId)) return res.status(404).json({ message: "Exam not found" });

  const attemptId = Number(req.params.attemptId);

  const [attempt] = await db
    .select()
    .from(examAttempts)
    .where(and(eq(examAttempts.id, attemptId), eq(examAttempts.examId, examId)));

  if (!attempt) return res.status(404).json({ message: "Attempt not found" });

  const questions = await db
    .select()
    .from(examQuestions)
    .where(eq(examQuestions.examId, examId))
    .orderBy(examQuestions.orderIndex);

  const answers: Record<number, string> = JSON.parse(attempt.answers || "{}");

  const detailed = questions.map((q) => ({
    ...q,
    selected: answers[q.id] ?? null,
    isCorrect: answers[q.id] === q.correctOption,
  }));

  res.json({ attempt, questions: detailed });
});

export default router;
