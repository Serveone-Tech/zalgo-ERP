import type { Request, Response } from "express";
import { db } from "../db";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import {
  students,
  courses,
  enrollments,
  attendanceRecords,
  homeworkRecords,
  testResults,
  batchHistory,
  studentRemarks,
} from "@shared/schema";

export const ReportCardController = {
  // ── Full report card data ─────────────────────────────────────────────────
  async getReportCard(req: Request, res: Response) {
    const studentId = Number(req.params.studentId);

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId));
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Student ka course
    const studentEnrollments = await db
      .select({ course: courses })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, studentId));

    // Attendance
    const attendance = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, studentId))
      .orderBy(attendanceRecords.date);

    // Homework
    const homework = await db
      .select()
      .from(homeworkRecords)
      .where(eq(homeworkRecords.studentId, studentId))
      .orderBy(homeworkRecords.date);

    // Test Results
    const tests = await db
      .select()
      .from(testResults)
      .where(eq(testResults.studentId, studentId))
      .orderBy(testResults.testDate);

    // Batch History
    const batches = await db
      .select()
      .from(batchHistory)
      .where(eq(batchHistory.studentId, studentId))
      .orderBy(batchHistory.shiftDate);

    // Remarks
    const remarks = await db
      .select()
      .from(studentRemarks)
      .where(eq(studentRemarks.studentId, studentId))
      .orderBy(studentRemarks.date);

    // Stats calculate
    const totalClasses = attendance.length;
    const absentCount = attendance.filter((a) => a.status === "absent").length;
    const presentCount = totalClasses - absentCount;
    const attendancePercent =
      totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : "0";

    const totalHwDays = homework.length;
    const hwCompleted = totalClasses - totalHwDays; // simplified
    const hwPercent =
      totalClasses > 0
        ? (((totalClasses - totalHwDays) / totalClasses) * 100).toFixed(1)
        : "0";

    res.json({
      student,
      courses: studentEnrollments.map((e) => e.course),
      attendance: {
        records: attendance,
        totalClasses,
        absentCount,
        presentCount,
        attendancePercent,
      },
      homework: {
        records: homework,
        totalIncomplete: totalHwDays,
        hwPercent,
      },
      tests,
      batches,
      remarks,
      generatedAt: new Date().toISOString(),
    });
  },

  // ── Attendance CRUD ───────────────────────────────────────────────────────
  async addAttendance(req: Request, res: Response) {
    try {
      const schema = z.object({
        studentId: z.coerce.number(),
        date: z.coerce.date(),
        lecture: z.string().optional(),
        status: z.enum(["present", "absent"]).default("absent"),
        callingStatus: z.string().optional(),
        remark: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const [record] = await db
        .insert(attendanceRecords)
        .values(input)
        .returning();
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  async deleteAttendance(req: Request, res: Response) {
    await db
      .delete(attendanceRecords)
      .where(eq(attendanceRecords.id, Number(req.params.id)));
    res.status(204).send();
  },

  // ── Homework CRUD ─────────────────────────────────────────────────────────
  async addHomework(req: Request, res: Response) {
    try {
      const schema = z.object({
        studentId: z.coerce.number(),
        date: z.coerce.date(),
        excuseByStudent: z.string().optional(),
        callingStatus: z.string().optional(),
        remark: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const [record] = await db
        .insert(homeworkRecords)
        .values(input)
        .returning();
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  async deleteHomework(req: Request, res: Response) {
    await db
      .delete(homeworkRecords)
      .where(eq(homeworkRecords.id, Number(req.params.id)));
    res.status(204).send();
  },

  // ── Test Results CRUD ─────────────────────────────────────────────────────
  async addTestResult(req: Request, res: Response) {
    try {
      const schema = z.object({
        studentId: z.coerce.number(),
        courseId: z.coerce.number().optional().nullable(),
        testName: z.string(),
        testDate: z.coerce.date(),
        marksObtained: z.coerce.number(),
        totalMarks: z.coerce.number(),
        rank: z.coerce.number().optional().nullable(),
        studentsAppeared: z.coerce.number().optional().nullable(),
        averageMarks: z.string().optional().nullable(),
        highestMarks: z.coerce.number().optional().nullable(),
        remark: z.string().optional().nullable(),
      });
      const input = schema.parse(req.body);
      const [record] = await db.insert(testResults).values(input).returning();
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  async deleteTestResult(req: Request, res: Response) {
    await db
      .delete(testResults)
      .where(eq(testResults.id, Number(req.params.id)));
    res.status(204).send();
  },

  // ── Remark CRUD ───────────────────────────────────────────────────────────
  async addRemark(req: Request, res: Response) {
    try {
      const schema = z.object({
        studentId: z.coerce.number(),
        date: z.coerce.date(),
        remark: z.string(),
        addedBy: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const [record] = await db
        .insert(studentRemarks)
        .values(input)
        .returning();
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  async deleteRemark(req: Request, res: Response) {
    await db
      .delete(studentRemarks)
      .where(eq(studentRemarks.id, Number(req.params.id)));
    res.status(204).send();
  },

  // ── Batch History CRUD ────────────────────────────────────────────────────
  async addBatchHistory(req: Request, res: Response) {
    try {
      const schema = z.object({
        studentId: z.coerce.number(),
        fromBatch: z.string().optional(),
        toBatch: z.string().optional(),
        shiftDate: z.coerce.date(),
        reason: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const [record] = await db.insert(batchHistory).values(input).returning();
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },
};
