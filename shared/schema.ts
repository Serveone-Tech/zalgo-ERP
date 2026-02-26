import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Leads (Enquiries)
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  parentName: text("parent_name"),
  phone: text("phone").notNull(),
  courseInterested: text("course_interested").notNull(),
  status: text("status").notNull().default("New"), // New, Follow-up, Converted, Dropped
  createdAt: timestamp("created_at").defaultNow(),
});

// Students
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  enrollmentNo: text("enrollment_no").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  parentPhone: text("parent_phone").notNull(),
  address: text("address"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teachers
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  subject: text("subject").notNull(),
  qualification: text("qualification"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses (Batches/Classes)
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  duration: text("duration").notNull(),
  fee: integer("fee").notNull(),
  status: text("status").notNull().default("Active"),
});

// Enrollments (Student -> Course)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

// Fees (Payments)
export const fees = pgTable("fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  amountPaid: integer("amount_paid").notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentMode: text("payment_mode").notNull(), // Cash, Online, Cheque
  receiptNo: text("receipt_no").notNull().unique(),
  status: text("status").notNull().default("Paid"),
});

export const feesRelations = relations(fees, ({ one }) => ({
  student: one(students, {
    fields: [fees.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [fees.courseId],
    references: [courses.id],
  }),
}));

// Base Schemas
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true });
export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true });
export const insertFeeSchema = createInsertSchema(fees).omit({ id: true, paymentDate: true });

// Types
export type Lead = typeof leads.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Fee = typeof fees.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertFee = z.infer<typeof insertFeeSchema>;
