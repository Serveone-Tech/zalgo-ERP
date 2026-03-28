import { db } from "./db";
import {
  branches,
  users,
  leads,
  students,
  teachers,
  courses,
  enrollments,
  fees,
  feePlans,
  feeInstallments,
  assignments,
  exams,
  inventory,
  transactions,
  communications,
  notifications,
  type InsertBranch,
  type InsertLead,
  type InsertStudent,
  type InsertTeacher,
  type InsertCourse,
  type InsertEnrollment,
  type InsertFee,
  type InsertFeePlan,
  type InsertFeeInstallment,
  type InsertAssignment,
  type InsertExam,
  type InsertInventory,
  type InsertTransaction,
  type InsertCommunication,
  type InsertNotification,
  type Branch,
  type User,
  type Lead,
  type Student,
  type Teacher,
  type Course,
  type Enrollment,
  type Fee,
  type FeePlan,
  type FeeInstallment,
  type Assignment,
  type Exam,
  type InventoryItem,
  type Transaction,
  type Communication,
  type Notification,
} from "@shared/schema";
import { eq, count, gte, lte, and, desc } from "drizzle-orm";

export interface IStorage {
  // Branches
  getBranches(): Promise<Branch[]>;
  getBranch(id: number): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: number, branch: Partial<InsertBranch>): Promise<Branch>;
  deleteBranch(id: number): Promise<void>;

  // Users
  getUsers(): Promise<Omit<User, "passwordHash">[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;
  updateUser(
    id: number,
    user: Partial<Omit<User, "id" | "createdAt" | "passwordHash">>,
  ): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // Leads
  getLeads(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
  }): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: number): Promise<void>;

  // Students
  getStudents(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
  }): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;

  // Teachers
  getTeachers(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
  }): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher>;
  deleteTeacher(id: number): Promise<void>;

  // Courses
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseStudents(
    courseId: number,
  ): Promise<{ student: Student; enrollment: Enrollment }[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;

  // Enrollments
  getEnrollments(): Promise<Enrollment[]>;
  getEnrollmentByStudentAndCourse(
    studentId: number,
    courseId: number,
  ): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  deleteEnrollment(id: number): Promise<void>;

  // Fees
  getFees(opts?: { branchId?: number; from?: Date; to?: Date }): Promise<Fee[]>;
  createFee(fee: InsertFee): Promise<Fee>;
  deleteFee(id: number): Promise<void>;

  // Fee Plans
  getFeePlans(studentId?: number, branchId?: number): Promise<FeePlan[]>;
  getFeePlan(id: number): Promise<FeePlan | undefined>;
  createFeePlan(plan: InsertFeePlan): Promise<FeePlan>;
  updateFeePlan(id: number, plan: Partial<InsertFeePlan>): Promise<FeePlan>;

  // Fee Installments
  getFeeInstallments(
    feePlanId?: number,
    branchId?: number,
  ): Promise<FeeInstallment[]>;
  getOverdueInstallments(): Promise<FeeInstallment[]>;
  createFeeInstallment(inst: InsertFeeInstallment): Promise<FeeInstallment>;
  updateFeeInstallment(
    id: number,
    inst: Partial<InsertFeeInstallment>,
  ): Promise<FeeInstallment>;

  // Dashboard Stats
  getDashboardStats(opts?: {
    from?: Date;
    to?: Date;
    branchId?: number;
  }): Promise<{
    totalStudents: number;
    activeLeads: number;
    totalTeachers: number;
    totalRevenue: number;
    pendingFees: number;
    recentLeads: Lead[];
    courseEnrollments: { courseName: string; studentCount: number }[];
  }>;

  // Assignments
  getAssignments(): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;

  // Exams
  getExams(): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;

  // Inventory
  getInventory(): Promise<InventoryItem[]>;
  createInventory(item: InsertInventory): Promise<InventoryItem>;

  // Transactions
  getTransactions(branchId?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;

  // Communications
  getCommunications(): Promise<Communication[]>;
  createCommunication(comm: InsertCommunication): Promise<Communication>;

  // Notifications
  getNotifications(): Promise<Notification[]>;
  createNotification(n: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ── Helper: courseInterested name se course dhundh ke enrollment banao ────────
  private async autoEnroll(
    studentId: number,
    courseInterested: string | null | undefined,
  ): Promise<void> {
    if (!courseInterested) return;

    // Course name se match karo (case-insensitive)
    const allCourses = await db.select().from(courses);
    const matched = allCourses.find(
      (c) => c.name.toLowerCase() === courseInterested.toLowerCase(),
    );
    if (!matched) return; // Course nahi mila toh skip

    // Duplicate enrollment check
    const existing = await this.getEnrollmentByStudentAndCourse(
      studentId,
      matched.id,
    );
    if (existing) return; // Already enrolled

    await db.insert(enrollments).values({ studentId, courseId: matched.id });
  }

  // ── Helper: purani enrollment hatao aur nayi banao (edit case) ───────────────
  private async reEnroll(
    studentId: number,
    newCourse: string | null | undefined,
  ): Promise<void> {
    // Student ki existing enrollments fetch karo
    const existing = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));

    // Naya course resolve karo
    const allCourses = await db.select().from(courses);
    const matched = newCourse
      ? allCourses.find((c) => c.name.toLowerCase() === newCourse.toLowerCase())
      : null;

    // Agar purani enrollment usi course ki hai toh kuch mat karo
    if (matched && existing.some((e) => e.courseId === matched.id)) return;

    // Purani courseInterested-based enrollment hatao
    // (sirf woh jo pehle autoEnroll se bani thi — sabhi existing hatao aur naya add karo)
    for (const e of existing) {
      await db.delete(enrollments).where(eq(enrollments.id, e.id));
    }

    // Naya course enroll karo
    if (matched) {
      await db.insert(enrollments).values({ studentId, courseId: matched.id });
    }
  }

  // Branches
  async getBranches(): Promise<Branch[]> {
    return await db.select().from(branches).orderBy(branches.name);
  }
  async getBranch(id: number): Promise<Branch | undefined> {
    const [b] = await db.select().from(branches).where(eq(branches.id, id));
    return b;
  }
  async createBranch(branch: InsertBranch): Promise<Branch> {
    const [b] = await db.insert(branches).values(branch).returning();
    return b;
  }
  async updateBranch(
    id: number,
    updates: Partial<InsertBranch>,
  ): Promise<Branch> {
    const [b] = await db
      .update(branches)
      .set(updates)
      .where(eq(branches.id, id))
      .returning();
    return b;
  }
  async deleteBranch(id: number): Promise<void> {
    await db.delete(branches).where(eq(branches.id, id));
  }

  // Users
  async getUsers(): Promise<Omit<User, "passwordHash">[]> {
    const all = await db.select().from(users).orderBy(users.createdAt);
    return all.map(({ passwordHash, ...u }) => u);
  }
  async getUser(id: number): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.email, email));
    return u;
  }
  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const [u] = await db.insert(users).values(user).returning();
    return u;
  }
  async updateUser(
    id: number,
    updates: Partial<Omit<User, "id" | "createdAt" | "passwordHash">>,
  ): Promise<User> {
    const [u] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return u;
  }
  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Leads
  async getLeads(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
  }): Promise<Lead[]> {
    const { branchId, from, to } = opts || {};
    const conditions = [];
    if (branchId) conditions.push(eq(leads.branchId, branchId));
    if (from) conditions.push(gte(leads.createdAt, from));
    if (to) conditions.push(lte(leads.createdAt, to));
    return await db
      .select()
      .from(leads)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(leads.createdAt));
  }
  async getLead(id: number): Promise<Lead | undefined> {
    const [l] = await db.select().from(leads).where(eq(leads.id, id));
    return l;
  }
  async createLead(lead: InsertLead): Promise<Lead> {
    const [l] = await db.insert(leads).values(lead).returning();
    return l;
  }
  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead> {
    const [l] = await db
      .update(leads)
      .set(updates)
      .where(eq(leads.id, id))
      .returning();
    return l;
  }
  async deleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  // Students
  async getStudents(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
  }): Promise<Student[]> {
    const { branchId, from, to } = opts || {};
    const conditions = [];
    if (branchId) conditions.push(eq(students.branchId, branchId));
    if (from) conditions.push(gte(students.createdAt, from));
    if (to) conditions.push(lte(students.createdAt, to));
    return await db
      .select()
      .from(students)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(students.createdAt));
  }
  async getStudent(id: number): Promise<Student | undefined> {
    const [s] = await db.select().from(students).where(eq(students.id, id));
    return s;
  }

  // ── createStudent: student banao + auto-enroll in course ─────────────────────
  async createStudent(student: InsertStudent): Promise<Student> {
    const [s] = await db.insert(students).values(student).returning();

    // Agar courseInterested hai toh enrollments table mein bhi daalo
    await this.autoEnroll(s.id, s.courseInterested);

    return s;
  }

  // ── updateStudent: course badla toh enrollment bhi update karo ───────────────
  async updateStudent(
    id: number,
    updates: Partial<InsertStudent>,
  ): Promise<Student> {
    const [s] = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, id))
      .returning();

    // Agar courseInterested update hua hai toh enrollment bhi sync karo
    if ("courseInterested" in updates) {
      await this.reEnroll(s.id, s.courseInterested);
    }

    return s;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(feeInstallments).where(eq(feeInstallments.studentId, id));
    await db.delete(feePlans).where(eq(feePlans.studentId, id));
    await db.delete(fees).where(eq(fees.studentId, id));
    await db.delete(enrollments).where(eq(enrollments.studentId, id));

    // Ab student delete karo
    await db.delete(students).where(eq(students.id, id));
  }
  // Teachers
  async getTeachers(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
  }): Promise<Teacher[]> {
    const { branchId, from, to } = opts || {};
    const conditions = [];
    if (branchId) conditions.push(eq(teachers.branchId, branchId));
    if (from) conditions.push(gte(teachers.createdAt, from));
    if (to) conditions.push(lte(teachers.createdAt, to));
    return await db
      .select()
      .from(teachers)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(teachers.createdAt));
  }
  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [t] = await db.select().from(teachers).where(eq(teachers.id, id));
    return t;
  }
  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [t] = await db.insert(teachers).values(teacher).returning();
    return t;
  }
  async updateTeacher(
    id: number,
    updates: Partial<InsertTeacher>,
  ): Promise<Teacher> {
    const [t] = await db
      .update(teachers)
      .set(updates)
      .where(eq(teachers.id, id))
      .returning();
    return t;
  }
  async deleteTeacher(id: number): Promise<void> {
    await db.delete(teachers).where(eq(teachers.id, id));
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }
  async getCourse(id: number): Promise<Course | undefined> {
    const [c] = await db.select().from(courses).where(eq(courses.id, id));
    return c;
  }
  async getCourseStudents(
    courseId: number,
  ): Promise<{ student: Student; enrollment: Enrollment }[]> {
    return await db
      .select({ student: students, enrollment: enrollments })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(eq(enrollments.courseId, courseId));
  }
  async createCourse(course: InsertCourse): Promise<Course> {
    const [c] = await db.insert(courses).values(course).returning();
    return c;
  }
  async updateCourse(
    id: number,
    updates: Partial<InsertCourse>,
  ): Promise<Course> {
    const [c] = await db
      .update(courses)
      .set(updates)
      .where(eq(courses.id, id))
      .returning();
    return c;
  }
  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Enrollments
  async getEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments);
  }
  async getEnrollmentByStudentAndCourse(
    studentId: number,
    courseId: number,
  ): Promise<Enrollment | undefined> {
    const [e] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, courseId),
        ),
      );
    return e;
  }
  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [e] = await db.insert(enrollments).values(enrollment).returning();
    return e;
  }
  async deleteEnrollment(id: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.id, id));
  }

  // Fees
  async getFees(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
  }): Promise<Fee[]> {
    const { branchId, from, to } = opts || {};
    const result = await db
      .select({ fee: fees })
      .from(fees)
      .leftJoin(students, eq(fees.studentId, students.id))
      .where(
        and(
          branchId ? eq(students.branchId, branchId) : undefined,
          from ? gte(fees.paymentDate, from) : undefined,
          to ? lte(fees.paymentDate, to) : undefined,
        ),
      )
      .orderBy(desc(fees.paymentDate));
    return result.map((r) => r.fee);
  }
  async createFee(fee: InsertFee): Promise<Fee> {
    const [f] = await db.insert(fees).values(fee).returning();
    return f;
  }
  async deleteFee(id: number): Promise<void> {
    await db.delete(fees).where(eq(fees.id, id));
  }

  // Fee Plans
  async getFeePlans(studentId?: number, branchId?: number): Promise<FeePlan[]> {
    const result = await db
      .select({ plan: feePlans })
      .from(feePlans)
      .leftJoin(students, eq(feePlans.studentId, students.id))
      .where(
        and(
          studentId ? eq(feePlans.studentId, studentId) : undefined,
          branchId ? eq(students.branchId, branchId) : undefined,
        ),
      )
      .orderBy(desc(feePlans.createdAt));
    return result.map((r) => r.plan);
  }
  async getFeePlan(id: number): Promise<FeePlan | undefined> {
    const [p] = await db.select().from(feePlans).where(eq(feePlans.id, id));
    return p;
  }
  async createFeePlan(plan: InsertFeePlan): Promise<FeePlan> {
    const [p] = await db.insert(feePlans).values(plan).returning();
    return p;
  }
  async updateFeePlan(
    id: number,
    updates: Partial<InsertFeePlan>,
  ): Promise<FeePlan> {
    const [p] = await db
      .update(feePlans)
      .set(updates)
      .where(eq(feePlans.id, id))
      .returning();
    return p;
  }

  // Fee Installments
  async getFeeInstallments(
    feePlanId?: number,
    branchId?: number,
  ): Promise<FeeInstallment[]> {
    const result = await db
      .select({ inst: feeInstallments })
      .from(feeInstallments)
      .leftJoin(students, eq(feeInstallments.studentId, students.id))
      .where(
        and(
          feePlanId ? eq(feeInstallments.feePlanId, feePlanId) : undefined,
          branchId ? eq(students.branchId, branchId) : undefined,
        ),
      )
      .orderBy(feeInstallments.dueDate);
    return result.map((r) => r.inst);
  }
  async getOverdueInstallments(): Promise<FeeInstallment[]> {
    const now = new Date();
    return await db
      .select()
      .from(feeInstallments)
      .where(
        and(
          lte(feeInstallments.dueDate, now),
          eq(feeInstallments.status, "pending"),
        ),
      );
  }
  async createFeeInstallment(
    inst: InsertFeeInstallment,
  ): Promise<FeeInstallment> {
    const [i] = await db.insert(feeInstallments).values(inst).returning();
    return i;
  }
  async updateFeeInstallment(
    id: number,
    updates: Partial<InsertFeeInstallment>,
  ): Promise<FeeInstallment> {
    const [i] = await db
      .update(feeInstallments)
      .set(updates)
      .where(eq(feeInstallments.id, id))
      .returning();
    return i;
  }

  // Dashboard Stats
  async getDashboardStats(opts?: {
    from?: Date;
    to?: Date;
    branchId?: number;
  }) {
    const { from, to, branchId } = opts || {};
    const allTransactions = await db.select().from(transactions);

    const [studentsResult] = await db
      .select({ count: count() })
      .from(students)
      .where(branchId ? eq(students.branchId, branchId) : undefined);
    const [leadsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(
        and(
          eq(leads.status, "New"),
          branchId ? eq(leads.branchId, branchId) : undefined,
        ),
      );
    const [teachersResult] = await db
      .select({ count: count() })
      .from(teachers)
      .where(branchId ? eq(teachers.branchId, branchId) : undefined);

    const feeConditions = [];
    if (branchId) feeConditions.push(eq(fees.branchId, branchId));
    if (from) feeConditions.push(gte(fees.paymentDate, from));
    if (to) feeConditions.push(lte(fees.paymentDate, to));
    const allFees = await db
      .select()
      .from(fees)
      .where(feeConditions.length ? and(...feeConditions) : undefined);
    const totalRevenue = allFees.reduce((sum, fee) => sum + fee.amountPaid, 0);

    const allInstallments = await db
      .select()
      .from(feeInstallments)
      .where(eq(feeInstallments.status, "pending"));
    const pendingFees = allInstallments.reduce(
      (sum, i) => sum + (i.amount - (i.paidAmount ?? 0)),
      0,
    );

    const recentLeads = await db
      .select()
      .from(leads)
      .where(branchId ? eq(leads.branchId, branchId) : undefined)
      .orderBy(desc(leads.createdAt))
      .limit(5);

    const coursesList = await db.select().from(courses);
    const courseEnrollments = await Promise.all(
      coursesList.map(async (course) => {
        const [enrollmentCount] = await db
          .select({ count: count() })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));
        return { courseName: course.name, studentCount: enrollmentCount.count };
      }),
    );

    const totalIncome = allTransactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = allTransactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalStudents: studentsResult.count,
      activeLeads: leadsResult.count,
      totalTeachers: teachersResult.count,
      totalRevenue,
      pendingFees,
      recentLeads,
      courseEnrollments,
      totalIncome,
      totalExpense,
    };
  }

  // Assignments
  async getAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments).orderBy(assignments.createdAt);
  }
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [a] = await db.insert(assignments).values(assignment).returning();
    return a;
  }

  // Exams
  async getExams(): Promise<Exam[]> {
    return await db.select().from(exams).orderBy(exams.date);
  }
  async createExam(exam: InsertExam): Promise<Exam> {
    const [e] = await db.insert(exams).values(exam).returning();
    return e;
  }

  // Inventory
  async getInventory(): Promise<InventoryItem[]> {
    return await db.select().from(inventory).orderBy(inventory.itemName);
  }
  async createInventory(item: InsertInventory): Promise<InventoryItem> {
    const [i] = await db.insert(inventory).values(item).returning();
    return i;
  }

  // Transactions
  async getTransactions(branchId?: number): Promise<Transaction[]> {
    if (branchId) {
      return await db
        .select()
        .from(transactions)
        .where(eq(transactions.branchId, branchId))
        .orderBy(desc(transactions.date));
    }
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.date));
  }
  async createTransaction(
    transaction: InsertTransaction,
  ): Promise<Transaction> {
    const [t] = await db.insert(transactions).values(transaction).returning();
    return t;
  }
  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // Communications
  async getCommunications(): Promise<Communication[]> {
    return await db
      .select()
      .from(communications)
      .orderBy(desc(communications.sentAt));
  }
  async createCommunication(comm: InsertCommunication): Promise<Communication> {
    const [c] = await db.insert(communications).values(comm).returning();
    return c;
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }
  async createNotification(n: InsertNotification): Promise<Notification> {
    const [notif] = await db.insert(notifications).values(n).returning();
    return notif;
  }
  async markNotificationRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }
  async markAllNotificationsRead(): Promise<void> {
    await db.update(notifications).set({ isRead: true });
  }
}

export const storage = new DatabaseStorage();
