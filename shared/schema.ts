import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Branches ─────────────────────────────────────────────────────────────────
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").default(true),
  adminId: integer("admin_id").references((): any => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Users (Authentication & Roles) ───────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("staff"),
  permissions: text("permissions").array().default([]),
  branchId: integer("branch_id").references(() => branches.id),
  isActive: boolean("is_active").default(true),
  adminId: integer("admin_id").references((): any => users.id),
  isOnboarded: boolean("is_onboarded").default(false),
  organizationId: integer("organization_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Leads (Enquiries) ────────────────────────────────────────────────────────
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  parentName: text("parent_name"),
  phone: text("phone").notNull(),
  parentPhone: text("parent_phone"),
  address: text("address"),
  courseInterested: text("course_interested").notNull(),
  status: text("status").notNull().default("New"),
  branchId: integer("branch_id").references(() => branches.id),
  adminId: integer("admin_id").references(() => users.id), // ← ADD
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Students ─────────────────────────────────────────────────────────────────
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  enrollmentNo: text("enrollment_no").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone").notNull(),
  address: text("address"),
  profilePicture: text("profile_picture"),
  status: text("status").notNull().default("Active"),
  courseInterested: text("course_interested"),
  branchId: integer("branch_id").references(() => branches.id),
  adminId: integer("admin_id").references(() => users.id), // ← ADD
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Teachers ─────────────────────────────────────────────────────────────────
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  subject: text("subject").notNull(),
  qualification: text("qualification"),
  status: text("status").notNull().default("Active"),
  branchId: integer("branch_id").references(() => branches.id),
  adminId: integer("admin_id").references(() => users.id), // ← ADD
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Courses ──────────────────────────────────────────────────────────────────
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  duration: text("duration").notNull(),
  fee: integer("fee").notNull(),
  status: text("status").notNull().default("Active"),
  branchId: integer("branch_id").references(() => branches.id),
  adminId: integer("admin_id").references(() => users.id),
});

// ─── Enrollments ──────────────────────────────────────────────────────────────
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id)
    .notNull(),
  courseId: integer("course_id")
    .references(() => courses.id)
    .notNull(),
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

// ─── Fees (Payments) ──────────────────────────────────────────────────────────
export const fees = pgTable("fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id)
    .notNull(),
  courseId: integer("course_id")
    .references(() => courses.id)
    .notNull(),
  amountPaid: integer("amount_paid").notNull(),
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentMode: text("payment_mode").notNull(),
  receiptNo: text("receipt_no").notNull().unique(),
  status: text("status").notNull().default("Paid"),
  branchId: integer("branch_id").references(() => branches.id),
});

export const feesRelations = relations(fees, ({ one }) => ({
  student: one(students, {
    fields: [fees.studentId],
    references: [students.id],
  }),
  course: one(courses, { fields: [fees.courseId], references: [courses.id] }),
}));

// ─── Fee Plans ────────────────────────────────────────────────────────────────
export const feePlans = pgTable("fee_plans", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id)
    .notNull(),
  courseId: integer("course_id").references(() => courses.id),
  totalFee: integer("total_fee").notNull(),
  discount: integer("discount").default(0),
  netFee: integer("net_fee").notNull(),
  amountPaid: integer("amount_paid").default(0),
  paymentType: text("payment_type").notNull().default("onetime"),
  installmentCount: integer("installment_count").default(1),
  installmentAmount: integer("installment_amount"),
  startDate: timestamp("start_date"),
  nextDueDate: timestamp("next_due_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Fee Installments ─────────────────────────────────────────────────────────
export const feeInstallments = pgTable("fee_installments", {
  id: serial("id").primaryKey(),
  feePlanId: integer("fee_plan_id")
    .references(() => feePlans.id)
    .notNull(),
  studentId: integer("student_id")
    .references(() => students.id)
    .notNull(),
  installmentNo: integer("installment_no").notNull(),
  amount: integer("amount").notNull(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  paidAmount: integer("paid_amount").default(0),
  status: text("status").notNull().default("pending"),
  receiptNo: text("receipt_no"),
  paymentMode: text("payment_mode"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Assignments ──────────────────────────────────────────────────────────────
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .references(() => courses.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Exams ────────────────────────────────────────────────────────────────────
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .references(() => courses.id)
    .notNull(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  maxMarks: integer("max_marks").notNull(),
});

// ─── Inventory ────────────────────────────────────────────────────────────────
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  category: text("category"),
  branchId: integer("branch_id").references(() => branches.id),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
  branchId: integer("branch_id").references(() => branches.id),
});

// ─── Communications ───────────────────────────────────────────────────────────
export const communications = pgTable("communications", {
  id: serial("id").primaryKey(),
  recipientId: integer("recipient_id").notNull(),
  recipientType: text("recipient_type").notNull(),
  type: text("type").notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  adminId: integer("admin_id").references(() => users.id),
  sentAt: timestamp("sent_at").defaultNow(),
});

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").default(false),
  relatedId: integer("related_id"),
  relatedType: text("related_type"),
  adminId: integer("admin_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Attendance Records ───────────────────────────────────────────────────────
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id)
    .notNull(),
  date: timestamp("date").notNull(),
  lecture: text("lecture"),
  status: text("status").notNull().default("absent"),
  callingStatus: text("calling_status"),
  remark: text("remark"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Homework Records ─────────────────────────────────────────────────────────
export const homeworkRecords = pgTable("homework_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id)
    .notNull(),
  date: timestamp("date").notNull(),
  excuseByStudent: text("excuse_by_student"),
  callingStatus: text("calling_status"),
  remark: text("remark"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Test Results ─────────────────────────────────────────────────────────────
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id)
    .notNull(),
  courseId: integer("course_id").references(() => courses.id),
  testName: text("test_name").notNull(),
  testDate: timestamp("test_date").notNull(),
  marksObtained: integer("marks_obtained").notNull(),
  totalMarks: integer("total_marks").notNull(),
  rank: integer("rank"),
  studentsAppeared: integer("students_appeared"),
  averageMarks: text("average_marks"),
  highestMarks: integer("highest_marks"),
  remark: text("remark"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Batch History ────────────────────────────────────────────────────────────
export const batchHistory = pgTable("batch_history", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id)
    .notNull(),
  fromBatch: text("from_batch"),
  toBatch: text("to_batch"),
  shiftDate: timestamp("shift_date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Additional Remarks ───────────────────────────────────────────────────────
export const studentRemarks = pgTable("student_remarks", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id)
    .notNull(),
  date: timestamp("date").notNull(),
  remark: text("remark").notNull(),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Plans (SuperAdmin manages these) ────────────────────────────────────────
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  monthlyPrice: integer("monthly_price").notNull().default(0),
  yearlyPrice: integer("yearly_price").notNull().default(0),
  validityDays: integer("validity_days"),
  features: text("features").array().default([]),
  maxStudents: integer("max_students").default(50),
  maxBranches: integer("max_branches").default(1),
  maxTeachers: integer("max_teachers").default(5),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  razorpayMonthlyPlanId: text("razorpay_monthly_plan_id"),
  razorpayYearlyPlanId: text("razorpay_yearly_plan_id"),
  sortOrder: integer("sort_order").default(0),
  allowedModules: text("allowed_modules").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Organizations ────────────────────────────────────────────────────────────
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  logo: text("logo"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  type: text("type").default("coaching"),
  boardAffiliation: text("board_affiliation"),
  principalName: text("principal_name"),
  establishedYear: text("established_year"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  planId: integer("plan_id")
    .references(() => plans.id)
    .notNull(),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  razorpaySubId: text("razorpay_sub_id"),
  razorpayCustomerId: text("razorpay_customer_id"),
  autoRenew: boolean("auto_renew").default(false),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  planId: integer("plan_id")
    .references(() => plans.id)
    .notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").default("INR"),
  status: text("status").notNull().default("pending"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  billingCycle: text("billing_cycle"),
  description: text("description"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Insert Schemas ───────────────────────────────────────────────────────────
export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
});
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, passwordHash: true })
  .extend({ password: z.string().min(6) });
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});
export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
});
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
});
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
});
export const insertFeeSchema = createInsertSchema(fees).omit({
  id: true,
  paymentDate: true,
});
export const insertFeePlanSchema = createInsertSchema(feePlans).omit({
  id: true,
  createdAt: true,
});
export const insertFeeInstallmentSchema = createInsertSchema(
  feeInstallments,
).omit({ id: true, createdAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});
export const insertExamSchema = createInsertSchema(exams).omit({ id: true });
export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  date: true,
});
export const insertCommunicationSchema = createInsertSchema(
  communications,
).omit({ id: true, sentAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export const insertAttendanceSchema = createInsertSchema(
  attendanceRecords,
).omit({ id: true, createdAt: true });
export const insertHomeworkSchema = createInsertSchema(homeworkRecords).omit({
  id: true,
  createdAt: true,
});
export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
  createdAt: true,
});
export const insertBatchHistorySchema = createInsertSchema(batchHistory).omit({
  id: true,
  createdAt: true,
});
export const insertRemarkSchema = createInsertSchema(studentRemarks).omit({
  id: true,
  createdAt: true,
});
export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type Branch = typeof branches.$inferSelect;
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Fee = typeof fees.$inferSelect;
export type FeePlan = typeof feePlans.$inferSelect;
export type FeeInstallment = typeof feeInstallments.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type InventoryItem = typeof inventory.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Communication = typeof communications.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type HomeworkRecord = typeof homeworkRecords.$inferSelect;
export type TestResult = typeof testResults.$inferSelect;
export type BatchHistory = typeof batchHistory.$inferSelect;
export type StudentRemark = typeof studentRemarks.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Organization = typeof organizations.$inferSelect;

export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertFee = z.infer<typeof insertFeeSchema>;
export type InsertFeePlan = z.infer<typeof insertFeePlanSchema>;
export type InsertFeeInstallment = z.infer<typeof insertFeeInstallmentSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type InsertBatchHistory = z.infer<typeof insertBatchHistorySchema>;
export type InsertRemark = z.infer<typeof insertRemarkSchema>;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
