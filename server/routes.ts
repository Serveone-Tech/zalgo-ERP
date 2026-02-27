import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";

import leadsRouter from "./routes/leads.routes";
import studentsRouter from "./routes/students.routes";
import teachersRouter from "./routes/teachers.routes";
import coursesRouter from "./routes/courses.routes";
import feesRouter from "./routes/fees.routes";
import { assignmentsRouter, examsRouter } from "./routes/academics.routes";
import { inventoryRouter, transactionsRouter, communicationsRouter, dashboardRouter } from "./routes/operations.routes";
import authRouter from "./routes/auth.routes";
import branchesRouter from "./routes/branches.routes";
import { feePlansRouter, feeInstallmentsRouter } from "./routes/fee-plans.routes";
import notificationsRouter from "./routes/notifications.routes";

import { z } from "zod";
import { api } from "@shared/routes";
import { Router } from "express";
import { requireAuth } from "./controllers/auth.controller";
import bcrypt from "bcrypt";

const enrollmentsRouter = Router();
enrollmentsRouter.get("/", requireAuth, async (req, res) => {
  const enrollments = await storage.getEnrollments();
  res.json(enrollments);
});
enrollmentsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const bodySchema = api.enrollments.create.input.extend({
      studentId: z.coerce.number(),
      courseId: z.coerce.number(),
    });
    const input = bodySchema.parse(req.body);
    const existing = await storage.getEnrollmentByStudentAndCourse(input.studentId, input.courseId);
    if (existing) {
      return res.status(409).json({ message: "This student is already enrolled in this course." });
    }
    const enrollment = await storage.createEnrollment(input);
    res.status(201).json(enrollment);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
    throw err;
  }
});
enrollmentsRouter.delete("/:id", requireAuth, async (req, res) => {
  await storage.deleteEnrollment(Number(req.params.id));
  res.status(204).send();
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Auth (public endpoints: login/logout/me)
  app.use("/api/auth", authRouter);
  app.use("/api/branches", branchesRouter);
  app.use("/api/leads", leadsRouter);
  app.use("/api/students", studentsRouter);
  app.use("/api/teachers", teachersRouter);
  app.use("/api/courses", coursesRouter);
  app.use("/api/enrollments", enrollmentsRouter);
  app.use("/api/fees", feesRouter);
  app.use("/api/fee-plans", feePlansRouter);
  app.use("/api/fee-installments", feeInstallmentsRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/exams", examsRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/communications", communicationsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/notifications", notificationsRouter);

  await seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  // Seed admin user if none exist
  const existingUsers = await storage.getUsers();
  if (existingUsers.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      name: "Admin",
      email: "admin@badamsingh.com",
      passwordHash,
      role: "admin",
      permissions: ["leads", "students", "teachers", "courses", "fees", "assignments", "exams", "inventory", "transactions", "communications", "reports"],
      branchId: null,
      isActive: true,
    });
    console.log("[seed] Admin user created: admin@badamsingh.com / admin123");
  }

  // Seed branches if none exist
  const existingBranches = await storage.getBranches();
  if (existingBranches.length === 0) {
    await storage.createBranch({ name: "Main Branch", city: "Delhi", address: "Model Town, Delhi", phone: "011-12345678", email: "main@badamsingh.com", isActive: true });
    await storage.createBranch({ name: "South Delhi Branch", city: "Delhi", address: "Lajpat Nagar, South Delhi", phone: "011-87654321", email: "south@badamsingh.com", isActive: true });
    console.log("[seed] Branches created");
  }

  // Seed fee plans if none exist (independently of courses)
  const existingFeePlans = await storage.getFeePlans();
  if (existingFeePlans.length === 0) {
    const allStudents = await storage.getStudents();
    const allCourses = await storage.getCourses();
    if (allStudents.length > 0 && allCourses.length > 0) {
      const s1 = allStudents[0];
      const c1 = allCourses[0];
      const plan = await storage.createFeePlan({ studentId: s1.id, courseId: c1.id, totalFee: 150000, discount: 10000, netFee: 140000, amountPaid: 30000, paymentType: "installment", installmentCount: 3, startDate: new Date(), nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
      for (let i = 1; i <= 3; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + (i - 2)); // First due last month (overdue), second current, third next month
        await storage.createFeeInstallment({ feePlanId: plan.id, studentId: s1.id, installmentNo: i, amount: 30000, dueDate, status: i === 1 ? "paid" : "pending", paidAmount: i === 1 ? 30000 : 0, paidDate: i === 1 ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : null });
      }
      await storage.createNotification({ title: "Installment Overdue", message: `${s1.name} has an overdue installment of ₹30,000`, type: "warning", relatedId: s1.id, relatedType: "student" });
      console.log("[seed] Fee plans and installments created");
    }
  }

  // Seed courses if none exist
  const existingCourses = await storage.getCourses();
  if (existingCourses.length === 0) {
    const c1 = await storage.createCourse({ name: "JEE Main & Advanced", description: "2 Year Classroom Program for Class 11", duration: "24 Months", fee: 150000, status: "Active" });
    const c2 = await storage.createCourse({ name: "NEET UG", description: "1 Year Dropper Batch", duration: "12 Months", fee: 90000, status: "Active" });
    const c3 = await storage.createCourse({ name: "Foundation (Class 9-10)", description: "Science & Maths Foundation", duration: "12 Months", fee: 60000, status: "Active" });

    await storage.createLead({ studentName: "Rahul Kumar", parentName: "Sanjay Kumar", phone: "9876543210", courseInterested: "JEE Main & Advanced", status: "New" });
    await storage.createLead({ studentName: "Anjali Singh", parentName: "Rakesh Singh", phone: "9123498765", courseInterested: "NEET UG", status: "Follow-up" });

    const s1 = await storage.createStudent({ enrollmentNo: "BSC2026-001", name: "Priya Sharma", email: "priya@example.com", phone: "9123456789", parentName: "Ramesh Sharma", parentPhone: "9988776655", address: "123, Model Town, Delhi", status: "Active" });
    const s2 = await storage.createStudent({ enrollmentNo: "BSC2026-002", name: "Arjun Patel", email: "arjun@example.com", phone: "9234567890", parentName: "Suresh Patel", parentPhone: "9876543211", address: "45, Connaught Place, Delhi", status: "Active" });

    await storage.createTeacher({ name: "Anil Desai", email: "anil.desai@badamsingh.com", phone: "9876123450", subject: "Physics", qualification: "M.Sc Physics, B.Ed", status: "Active" });
    await storage.createTeacher({ name: "Sunita Verma", email: "sunita.verma@badamsingh.com", phone: "9765432109", subject: "Chemistry", qualification: "M.Sc Chemistry", status: "Active" });

    await storage.createEnrollment({ studentId: s1.id, courseId: c1.id });
    await storage.createEnrollment({ studentId: s2.id, courseId: c2.id });

    await storage.createFee({ studentId: s1.id, courseId: c1.id, amountPaid: 50000, paymentMode: "Online", receiptNo: "RCP-2026-001", status: "Paid" });
    await storage.createFee({ studentId: s2.id, courseId: c2.id, amountPaid: 30000, paymentMode: "Cash", receiptNo: "RCP-2026-002", status: "Paid" });

    // Seed a fee plan with installments
    const plan = await storage.createFeePlan({ studentId: s1.id, courseId: c1.id, totalFee: 150000, discount: 10000, netFee: 140000, amountPaid: 50000, paymentType: "installment", installmentCount: 3, startDate: new Date(), nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    for (let i = 1; i <= 3; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      await storage.createFeeInstallment({ feePlanId: plan.id, studentId: s1.id, installmentNo: i, amount: Math.round(90000 / 3), dueDate, status: i === 1 ? "paid" : "pending", paidAmount: i === 1 ? 30000 : 0, paidDate: i === 1 ? new Date() : null });
    }

    await storage.createTransaction({ type: "Income", category: "Fee Collection", amount: 50000, description: "Priya Sharma Fee" });
    await storage.createTransaction({ type: "Expense", category: "Salary", amount: 15000, description: "Teacher Salary Jan" });
    await storage.createInventory({ itemName: "Whiteboard Markers", category: "Stationery", quantity: 50 });
    await storage.createInventory({ itemName: "Projector", category: "Electronics", quantity: 2 });

    // Create overdue notification
    await storage.createNotification({ title: "Fee Overdue", message: "Priya Sharma has an overdue installment of ₹30,000", type: "warning", relatedId: s1.id, relatedType: "student" });

    console.log("[seed] Sample data seeded");
  }
}
