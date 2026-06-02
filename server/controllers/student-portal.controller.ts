import type { Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  students,
  attendanceRecords,
  testResults,
  fees,
  feePlans,
  feeInstallments,
  liveClasses,
  enrollments,
  users,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "../storage";

function getStudentUserId(req: Request): number {
  return (req.session as any).userId;
}

export const StudentPortalController = {
  async register(req: Request, res: Response) {
    const schema = z.object({
      enrollmentNo: z.string().min(1),
      password: z.string().min(6),
    });
    try {
      const data = schema.parse(req.body);
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.enrollmentNo, data.enrollmentNo.trim()));

      if (!student)
        return res.status(404).json({ message: "Enrollment number not found. Contact your institute." });

      if (!student.email)
        return res.status(400).json({ message: "No email registered for this enrollment. Contact your institute." });

      // If student already has a linked portal account, just ask them to login
      if ((student as any).userId)
        return res.status(400).json({ message: "Portal account already exists. Please login with your registered email." });

      const passwordHash = await bcrypt.hash(data.password, 10);

      // Reuse existing user record if email already in system, else create new
      let userId: number;
      const existing = await storage.getUserByEmail(student.email);
      if (existing) {
        // Update password and role in case it's a stale/different account
        await db.update(users).set({ passwordHash, role: "student", isActive: true } as any).where(eq(users.id, existing.id));
        userId = existing.id;
      } else {
        const newUser = await storage.createUser({
          name: student.name,
          email: student.email,
          passwordHash,
          role: "student",
          permissions: [],
          branchId: student.branchId,
          isActive: true,
          isOnboarded: true,
          adminId: student.adminId,
        } as any);
        userId = newUser.id;
      }

      await db
        .update(students)
        .set({ userId } as any)
        .where(eq(students.id, student.id));

      // Return email so frontend can show it to the user
      res.status(201).json({ message: "Account created. Please login.", email: student.email });
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      const message = err instanceof Error ? err.message : "Registration failed";
      return res.status(500).json({ message });
    }
  },

  async me(req: Request, res: Response) {
    const userId = getStudentUserId(req);
    const [student] = await db.select().from(students).where(eq(students.userId as any, userId));
    if (!student) return res.status(404).json({ message: "Student record not found" });
    res.json(student);
  },

  async attendance(req: Request, res: Response) {
    const userId = getStudentUserId(req);
    const [student] = await db.select({ id: students.id }).from(students).where(eq(students.userId as any, userId));
    if (!student) return res.status(404).json({ message: "Student not found" });
    const records = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, student.id))
      .orderBy(desc(attendanceRecords.date));
    res.json(records);
  },

  async exams(req: Request, res: Response) {
    const userId = getStudentUserId(req);
    const [student] = await db.select({ id: students.id }).from(students).where(eq(students.userId as any, userId));
    if (!student) return res.status(404).json({ message: "Student not found" });
    const results = await db
      .select()
      .from(testResults)
      .where(eq(testResults.studentId, student.id))
      .orderBy(desc(testResults.testDate));
    res.json(results);
  },

  async feesData(req: Request, res: Response) {
    const userId = getStudentUserId(req);
    const [student] = await db.select({ id: students.id }).from(students).where(eq(students.userId as any, userId));
    if (!student) return res.status(404).json({ message: "Student not found" });
    const [payments, installments] = await Promise.all([
      db.select().from(fees).where(eq(fees.studentId, student.id)).orderBy(desc(fees.paymentDate)),
      db.select().from(feeInstallments).where(eq(feeInstallments.studentId, student.id)).orderBy(feeInstallments.dueDate),
    ]);
    res.json({ payments, installments });
  },

  async liveClasses(req: Request, res: Response) {
    const userId = getStudentUserId(req);
    const [student] = await db
      .select({ id: students.id, adminId: students.adminId, canWatchLiveClasses: students.canWatchLiveClasses })
      .from(students)
      .where(eq(students.userId as any, userId));
    if (!student || !student.adminId) return res.json([]);
    if (student.canWatchLiveClasses === false) return res.json([]);

    // Get courses this student is enrolled in
    const enrolled = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.studentId, student.id));
    const enrolledCourseIds = new Set(enrolled.map(e => e.courseId));

    // Fetch all classes for this admin
    const allClasses = await db
      .select()
      .from(liveClasses)
      .where(eq(liveClasses.adminId, student.adminId))
      .orderBy(desc(liveClasses.scheduledAt));

    // Filter: show class if no course restriction, or student is enrolled in that course
    const visible = allClasses.filter(c =>
      !c.courseId || enrolledCourseIds.has(c.courseId)
    );

    res.json(visible);
  },

  async joinLiveClass(req: Request, res: Response) {
    const userId = getStudentUserId(req);
    const classId = Number(req.params.id);
    const [student] = await db
      .select({ id: students.id, adminId: students.adminId, canWatchLiveClasses: students.canWatchLiveClasses })
      .from(students)
      .where(eq(students.userId as any, userId));
    if (!student) return res.status(403).json({ message: "Student not found" });
    if (student.canWatchLiveClasses === false)
      return res.status(403).json({ message: "You do not have permission to watch live classes." });

    const [cls] = await db
      .select()
      .from(liveClasses)
      .where(and(eq(liveClasses.id, classId), eq(liveClasses.adminId, student.adminId!)));
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (cls.status !== "live") return res.status(400).json({ message: "Class is not live right now" });
    if (!cls.dailyRoomName) return res.status(400).json({ message: "Room not ready" });

    // If class is tied to a course, verify enrollment
    if (cls.courseId) {
      const [enrollment] = await db
        .select({ id: enrollments.id })
        .from(enrollments)
        .where(and(eq(enrollments.studentId, student.id), eq(enrollments.courseId, cls.courseId)));
      if (!enrollment)
        return res.status(403).json({ message: "You are not enrolled in the course for this class." });
    }

    const { createMeetingToken } = await import("../utils/daily.service");
    const { addHours } = await import("date-fns");
    const token = await createMeetingToken(cls.dailyRoomName, false, addHours(new Date(), 4));
    res.json({ roomUrl: cls.dailyRoomUrl, token });
  },

  async dashboard(req: Request, res: Response) {
    const userId = getStudentUserId(req);
    const [student] = await db.select().from(students).where(eq(students.userId as any, userId));
    if (!student) return res.status(404).json({ message: "Student not found" });
    const [attendanceList, examList, feeList, allLiveNow, enrolled] = await Promise.all([
      db.select().from(attendanceRecords).where(eq(attendanceRecords.studentId, student.id)),
      db.select().from(testResults).where(eq(testResults.studentId, student.id)),
      db.select().from(fees).where(eq(fees.studentId, student.id)),
      student.adminId
        ? db.select().from(liveClasses).where(and(eq(liveClasses.adminId, student.adminId), eq(liveClasses.status, "live")))
        : Promise.resolve([]),
      db.select({ courseId: enrollments.courseId }).from(enrollments).where(eq(enrollments.studentId, student.id)),
    ]);
    const enrolledIds = new Set(enrolled.map(e => e.courseId));
    const liveNowList = (allLiveNow as any[]).filter(c => !c.courseId || enrolledIds.has(c.courseId));
    const totalClasses = attendanceList.length;
    const presentClasses = attendanceList.filter((a) => a.status === "Present").length;
    const attendancePct = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : null;
    const totalFeePaid = feeList.reduce((s, f) => s + (f.amountPaid || 0), 0);
    res.json({
      student: { name: student.name, enrollmentNo: student.enrollmentNo, email: student.email, phone: student.phone, status: student.status, courseInterested: student.courseInterested },
      stats: { attendancePct, totalClasses, presentClasses, totalExams: examList.length, totalFeePaid, liveNow: (liveNowList as any[]).length },
    });
  },
};
