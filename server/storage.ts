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
import { eq, count, gte, lte, and, desc, or, inArray } from "drizzle-orm";

// ── Helper: get branch IDs that belong to an admin ───────────────────────────
async function getAdminBranchIds(adminId: number): Promise<number[]> {
  const rows = await db
    .select({ id: branches.id })
    .from(branches)
    .where(eq((branches as any).adminId, adminId));
  return rows.map((r) => r.id);
}

export interface IStorage {
  // Branches
  getBranches(adminId?: number): Promise<Branch[]>;
  getBranch(id: number): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: number, branch: Partial<InsertBranch>): Promise<Branch>;
  deleteBranch(id: number): Promise<void>;

  // Users
  getUsers(adminId?: number): Promise<Omit<User, "passwordHash">[]>;
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
    adminId?: number;
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
    adminId?: number;
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
    adminId?: number;
  }): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher>;
  deleteTeacher(id: number): Promise<void>;

  // Courses
  getCourses(adminId?: number): Promise<Course[]>;
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
  getFees(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
    adminId?: number;
  }): Promise<Fee[]>;
  createFee(fee: InsertFee): Promise<Fee>;
  deleteFee(id: number): Promise<void>;

  // Fee Plans
  getFeePlans(
    studentId?: number,
    branchId?: number,
    adminId?: number,
  ): Promise<FeePlan[]>;
  getFeePlan(id: number): Promise<FeePlan | undefined>;
  createFeePlan(plan: InsertFeePlan): Promise<FeePlan>;
  updateFeePlan(id: number, plan: Partial<InsertFeePlan>): Promise<FeePlan>;

  // Fee Installments
  getFeeInstallments(
    feePlanId?: number,
    branchId?: number,
    adminId?: number,
  ): Promise<FeeInstallment[]>;
  getOverdueInstallments(adminId?: number): Promise<FeeInstallment[]>;
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
    adminId?: number;
  }): Promise<{
    totalStudents: number;
    activeLeads: number;
    totalTeachers: number;
    totalRevenue: number;
    pendingFees: number;
    recentLeads: Lead[];
    courseEnrollments: { courseName: string; studentCount: number }[];
    totalIncome?: number;
    totalExpense?: number;
  }>;

  // Assignments
  getAssignments(adminId?: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;

  // Exams
  getExams(adminId?: number): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;

  // Inventory
  getInventory(adminId?: number): Promise<InventoryItem[]>;
  createInventory(item: InsertInventory): Promise<InventoryItem>;
  updateInventory(
    id: number,
    updates: Partial<InsertInventory>,
  ): Promise<InventoryItem>;
  deleteInventory(id: number): Promise<void>;

  // Transactions
  getTransactions(branchId?: number, adminId?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;

  // Communications
  getCommunications(adminId?: number): Promise<Communication[]>;
  createCommunication(comm: InsertCommunication): Promise<Communication>;

  // Notifications
  getNotifications(adminId?: number): Promise<Notification[]>;
  createNotification(n: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(adminId?: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ── Helper: courseInterested name se course dhundh ke enrollment banao ────────
  private async autoEnroll(
    studentId: number,
    courseInterested: string | null | undefined,
  ): Promise<void> {
    if (!courseInterested) return;
    const allCourses = await db.select().from(courses);
    const matched = allCourses.find(
      (c) => c.name.toLowerCase() === courseInterested.toLowerCase(),
    );
    if (!matched) return;
    const existing = await this.getEnrollmentByStudentAndCourse(
      studentId,
      matched.id,
    );
    if (existing) return;
    await db.insert(enrollments).values({ studentId, courseId: matched.id });
  }

  private async reEnroll(
    studentId: number,
    newCourse: string | null | undefined,
  ): Promise<void> {
    const existing = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));
    const allCourses = await db.select().from(courses);
    const matched = newCourse
      ? allCourses.find((c) => c.name.toLowerCase() === newCourse.toLowerCase())
      : null;
    if (matched && existing.some((e) => e.courseId === matched.id)) return;
    for (const e of existing) {
      await db.delete(enrollments).where(eq(enrollments.id, e.id));
    }
    if (matched) {
      await db.insert(enrollments).values({ studentId, courseId: matched.id });
    }
  }

  // ── Branches ─────────────────────────────────────────────────────────────────
  async getBranches(adminId?: number): Promise<Branch[]> {
    if (adminId) {
      return await db
        .select()
        .from(branches)
        .where(eq((branches as any).adminId, adminId))
        .orderBy(branches.name);
    }
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
    branch: Partial<InsertBranch>,
  ): Promise<Branch> {
    const [b] = await db
      .update(branches)
      .set(branch)
      .where(eq(branches.id, id))
      .returning();
    return b;
  }

  async deleteBranch(id: number): Promise<void> {
    await db.delete(branches).where(eq(branches.id, id));
  }

  // ── Users ─────────────────────────────────────────────────────────────────────
  async getUsers(adminId?: number): Promise<Omit<User, "passwordHash">[]> {
    let all;
    if (adminId) {
      all = await db
        .select()
        .from(users)
        .where(or(eq(users.id, adminId), eq((users as any).adminId, adminId)))
        .orderBy(users.createdAt);
    } else {
      all = await db.select().from(users).orderBy(users.createdAt);
    }
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

  // ── Leads ─────────────────────────────────────────────────────────────────────
  async getLeads(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
    adminId?: number;
  }): Promise<Lead[]> {
    const { branchId, from, to, adminId } = opts || {};
    const conditions: any[] = [];
    if (branchId) {
      conditions.push(eq(leads.branchId, branchId));
    } else if (adminId) {
      const bids = await getAdminBranchIds(adminId);
      if (bids.length > 0) conditions.push(inArray(leads.branchId, bids));
      else return [];
    }
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

  // ── Students ──────────────────────────────────────────────────────────────────
  async getStudents(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
    adminId?: number;
  }): Promise<Student[]> {
    const { branchId, from, to, adminId } = opts || {};
    const conditions: any[] = [];
    if (branchId) {
      conditions.push(eq(students.branchId, branchId));
    } else if (adminId) {
      const bids = await getAdminBranchIds(adminId);
      if (bids.length > 0) conditions.push(inArray(students.branchId, bids));
      else return [];
    }
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

  async createStudent(student: InsertStudent): Promise<Student> {
    const [s] = await db.insert(students).values(student).returning();
    await this.autoEnroll(s.id, s.courseInterested);
    return s;
  }

  async updateStudent(
    id: number,
    updates: Partial<InsertStudent>,
  ): Promise<Student> {
    const [s] = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, id))
      .returning();
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
    await db.delete(students).where(eq(students.id, id));
  }

  // ── Teachers ──────────────────────────────────────────────────────────────────
  async getTeachers(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
    adminId?: number;
  }): Promise<Teacher[]> {
    const { branchId, from, to, adminId } = opts || {};
    const conditions: any[] = [];
    if (branchId) {
      conditions.push(eq(teachers.branchId, branchId));
    } else if (adminId) {
      const bids = await getAdminBranchIds(adminId);
      if (bids.length > 0) conditions.push(inArray(teachers.branchId, bids));
      else return [];
    }
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

  // ── Courses ───────────────────────────────────────────────────────────────────
  async getCourses(adminId?: number): Promise<Course[]> {
    if (adminId) {
      return await db
        .select()
        .from(courses)
        .where(eq((courses as any).adminId, adminId));
    }
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

  // ── Enrollments ───────────────────────────────────────────────────────────────
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

  // ── Fees ──────────────────────────────────────────────────────────────────────
  async getFees(opts?: {
    branchId?: number;
    from?: Date;
    to?: Date;
    adminId?: number;
  }): Promise<Fee[]> {
    const { branchId, from, to, adminId } = opts || {};
    let bids: number[] = [];
    if (adminId && !branchId) {
      bids = await getAdminBranchIds(adminId);
      // Admin ki koi branch nahi = us admin ka koi data nahi
      if (bids.length === 0) return [];
    }
    const result = await db
      .select({ fee: fees })
      .from(fees)
      .leftJoin(students, eq(fees.studentId, students.id))
      .where(
        and(
          branchId
            ? eq(students.branchId, branchId)
            : bids.length > 0
              ? inArray(students.branchId, bids)
              : undefined,
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

  // ── Fee Plans ─────────────────────────────────────────────────────────────────
  async getFeePlans(
    studentId?: number,
    branchId?: number,
    adminId?: number,
  ): Promise<FeePlan[]> {
    let bids: number[] = [];
    if (adminId && !branchId && !studentId) {
      bids = await getAdminBranchIds(adminId);
      if (bids.length === 0) return [];
    }
    const result = await db
      .select({ plan: feePlans })
      .from(feePlans)
      .leftJoin(students, eq(feePlans.studentId, students.id))
      .where(
        and(
          studentId ? eq(feePlans.studentId, studentId) : undefined,
          branchId
            ? eq(students.branchId, branchId)
            : bids.length > 0
              ? inArray(students.branchId, bids)
              : undefined,
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

  // ── Fee Installments ──────────────────────────────────────────────────────────
  async getFeeInstallments(
    feePlanId?: number,
    branchId?: number,
    adminId?: number,
  ): Promise<FeeInstallment[]> {
    let bids: number[] = [];
    if (adminId && !branchId && !feePlanId) {
      bids = await getAdminBranchIds(adminId);
      if (bids.length === 0) return [];
    }
    const result = await db
      .select({ inst: feeInstallments })
      .from(feeInstallments)
      .leftJoin(students, eq(feeInstallments.studentId, students.id))
      .where(
        and(
          feePlanId ? eq(feeInstallments.feePlanId, feePlanId) : undefined,
          branchId
            ? eq(students.branchId, branchId)
            : bids.length > 0
              ? inArray(students.branchId, bids)
              : undefined,
        ),
      )
      .orderBy(feeInstallments.installmentNo);
    return result.map((r) => r.inst);
  }

  async getOverdueInstallments(adminId?: number): Promise<FeeInstallment[]> {
    const now = new Date();
    if (adminId) {
      const bids = await getAdminBranchIds(adminId);
      if (bids.length === 0) return [];
      return await db
        .select({ inst: feeInstallments })
        .from(feeInstallments)
        .leftJoin(students, eq(feeInstallments.studentId, students.id))
        .where(
          and(
            eq(feeInstallments.status, "pending"),
            lte(feeInstallments.dueDate, now),
            inArray(students.branchId, bids),
          ),
        )
        .then((r) => r.map((x) => x.inst));
    }
    return await db
      .select()
      .from(feeInstallments)
      .where(
        and(
          eq(feeInstallments.status, "pending"),
          lte(feeInstallments.dueDate, now),
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

  // ── Dashboard Stats ───────────────────────────────────────────────────────────
  async getDashboardStats(opts?: {
    from?: Date;
    to?: Date;
    branchId?: number;
    adminId?: number;
  }) {
    const { from, to, branchId, adminId } = opts || {};

    let bids: number[] = [];
    if (adminId && !branchId) {
      bids = await getAdminBranchIds(adminId);
      // Agar admin ki koi branch nahi toh sab zero return karo
      if (bids.length === 0) {
        return {
          totalStudents: 0,
          activeLeads: 0,
          totalTeachers: 0,
          totalRevenue: 0,
          pendingFees: 0,
          recentLeads: [],
          courseEnrollments: [],
          totalIncome: 0,
          totalExpense: 0,
        };
      }
    }

    const branchFilter = branchId
      ? (col: any) => eq(col, branchId)
      : bids.length > 0
        ? (col: any) => inArray(col, bids)
        : null;

    const [studentsResult] = await db
      .select({ count: count() })
      .from(students)
      .where(branchFilter ? branchFilter(students.branchId) : undefined);

    const [leadsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(
        and(
          eq(leads.status, "New"),
          branchFilter ? branchFilter(leads.branchId) : undefined,
        ),
      );

    const [teachersResult] = await db
      .select({ count: count() })
      .from(teachers)
      .where(branchFilter ? branchFilter(teachers.branchId) : undefined);

    // Fees via student join (fees.branchId may be null, use student's branchId)
    const allFees = await db
      .select({ fee: fees })
      .from(fees)
      .leftJoin(students, eq(fees.studentId, students.id))
      .where(
        and(
          branchFilter ? branchFilter(students.branchId) : undefined,
          from ? gte(fees.paymentDate, from) : undefined,
          to ? lte(fees.paymentDate, to) : undefined,
        ),
      )
      .then((r) => r.map((x) => x.fee));
    const totalRevenue = allFees.reduce((sum, fee) => sum + fee.amountPaid, 0);

    // Pending installments filtered by branch
    const pendingInstQuery = db
      .select({ inst: feeInstallments })
      .from(feeInstallments)
      .leftJoin(students, eq(feeInstallments.studentId, students.id))
      .where(
        and(
          eq(feeInstallments.status, "pending"),
          branchFilter ? branchFilter(students.branchId) : undefined,
        ),
      );
    const allInstallments = await pendingInstQuery.then((r) =>
      r.map((x) => x.inst),
    );
    const pendingFees = allInstallments.reduce(
      (sum, i) => sum + (i.amount - (i.paidAmount ?? 0)),
      0,
    );

    const recentLeads = await db
      .select()
      .from(leads)
      .where(branchFilter ? branchFilter(leads.branchId) : undefined)
      .orderBy(desc(leads.createdAt))
      .limit(5);

    const coursesList = adminId
      ? await db
          .select()
          .from(courses)
          .where(eq((courses as any).adminId, adminId))
      : await db.select().from(courses);

    const courseEnrollments = await Promise.all(
      coursesList.map(async (course) => {
        const [enrollmentCount] = await db
          .select({ count: count() })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));
        return { courseName: course.name, studentCount: enrollmentCount.count };
      }),
    );

    const txFilter = branchFilter
      ? branchFilter(transactions.branchId)
      : undefined;
    const allTransactions = await db
      .select()
      .from(transactions)
      .where(txFilter);
    const totalIncome = allTransactions
      .filter((t) => t.type === "Income")
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = allTransactions
      .filter((t) => t.type === "Expense")
      .reduce((s, t) => s + t.amount, 0);

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

  // ── Assignments ───────────────────────────────────────────────────────────────
  async getAssignments(adminId?: number): Promise<Assignment[]> {
    if (adminId) {
      const adminCourses = await db
        .select({ id: courses.id })
        .from(courses)
        .where(eq((courses as any).adminId, adminId));
      const cids = adminCourses.map((c) => c.id);
      if (cids.length === 0) return [];
      return await db
        .select()
        .from(assignments)
        .where(inArray(assignments.courseId, cids))
        .orderBy(assignments.createdAt);
    }
    return await db.select().from(assignments).orderBy(assignments.createdAt);
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [a] = await db.insert(assignments).values(assignment).returning();
    return a;
  }

  // ── Exams ─────────────────────────────────────────────────────────────────────
  async getExams(adminId?: number): Promise<Exam[]> {
    if (adminId) {
      const adminCourses = await db
        .select({ id: courses.id })
        .from(courses)
        .where(eq((courses as any).adminId, adminId));
      const cids = adminCourses.map((c) => c.id);
      if (cids.length === 0) return [];
      return await db
        .select()
        .from(exams)
        .where(inArray(exams.courseId, cids))
        .orderBy(exams.date);
    }
    return await db.select().from(exams).orderBy(exams.date);
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [e] = await db.insert(exams).values(exam).returning();
    return e;
  }

  // ── Inventory ─────────────────────────────────────────────────────────────────
  async getInventory(adminId?: number): Promise<InventoryItem[]> {
    if (adminId) {
      const bids = await getAdminBranchIds(adminId);
      if (bids.length === 0) return [];
      return await db
        .select()
        .from(inventory)
        .where(inArray(inventory.branchId, bids))
        .orderBy(inventory.itemName);
    }
    return await db.select().from(inventory).orderBy(inventory.itemName);
  }

  async createInventory(item: InsertInventory): Promise<InventoryItem> {
    const [i] = await db.insert(inventory).values(item).returning();
    return i;
  }

  async updateInventory(
    id: number,
    updates: Partial<InsertInventory>,
  ): Promise<InventoryItem> {
    const [i] = await db
      .update(inventory)
      .set(updates)
      .where(eq(inventory.id, id))
      .returning();
    return i;
  }

  async deleteInventory(id: number): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  // ── Transactions ──────────────────────────────────────────────────────────────
  async getTransactions(
    branchId?: number,
    adminId?: number,
  ): Promise<Transaction[]> {
    const conditions: any[] = [];
    if (branchId) {
      conditions.push(eq(transactions.branchId, branchId));
    } else if (adminId) {
      const bids = await getAdminBranchIds(adminId);
      if (bids.length > 0)
        conditions.push(inArray(transactions.branchId, bids));
      else return [];
    }
    return await db
      .select()
      .from(transactions)
      .where(conditions.length ? and(...conditions) : undefined)
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

  // ── Communications ────────────────────────────────────────────────────────────
  async getCommunications(adminId?: number): Promise<Communication[]> {
    if (adminId) {
      return await db
        .select()
        .from(communications)
        .where(eq((communications as any).adminId, adminId))
        .orderBy(desc(communications.sentAt));
    }
    return await db
      .select()
      .from(communications)
      .orderBy(desc(communications.sentAt));
  }

  async createCommunication(comm: InsertCommunication): Promise<Communication> {
    const [c] = await db.insert(communications).values(comm).returning();
    return c;
  }

  // ── Notifications ─────────────────────────────────────────────────────────────
  async getNotifications(adminId?: number): Promise<Notification[]> {
    if (adminId) {
      return await db
        .select()
        .from(notifications)
        .where(eq((notifications as any).adminId, adminId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    }
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

  async markAllNotificationsRead(adminId?: number): Promise<void> {
    if (adminId) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq((notifications as any).adminId, adminId));
    } else {
      await db.update(notifications).set({ isRead: true });
    }
  }
}

export const storage = new DatabaseStorage();
