import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";

import leadsRouter from "./routes/leads.routes";
import studentsRouter from "./routes/students.routes";
import teachersRouter from "./routes/teachers.routes";
import coursesRouter from "./routes/courses.routes";
import feesRouter from "./routes/fees.routes";
import { assignmentsRouter, examsRouter } from "./routes/academics.routes";
import {
  inventoryRouter,
  transactionsRouter,
  communicationsRouter,
  dashboardRouter,
} from "./routes/operations.routes";
import authRouter from "./routes/auth.routes";
import branchesRouter from "./routes/branches.routes";
import {
  feePlansRouter,
  feeInstallmentsRouter,
} from "./routes/fee-plans.routes";
import notificationsRouter from "./routes/notifications.routes";
import reportCardRouter from "./routes/report-card.routes";
import plansRouter from "./routes/plans.routes";
import automationRouter from "./routes/automation.routes";
import { z } from "zod";
import { api } from "@shared/routes";
import { Router } from "express";
import { requireAuth, requireAdmin } from "./controllers/auth.controller";
import { getBlockedIPs, unblockIP } from "./middleware/rate-limit";
import bcrypt from "bcrypt";

// Admin-only: Blocked IP management
const adminRouter = Router();
adminRouter.get("/blocked-ips", requireAdmin, (_req, res) => {
  res.json(getBlockedIPs());
});
adminRouter.delete("/blocked-ips/:ip", requireAdmin, (req, res) => {
  const ip = decodeURIComponent(req.params.ip);
  const success = unblockIP(ip);
  if (!success)
    return res.status(404).json({ message: "IP not found in blocked list" });
  res.json({ message: `IP ${ip} unblocked successfully` });
});

const enrollmentsRouter = Router();
enrollmentsRouter.get("/", requireAuth, async (req, res) => {
  const s = req.session as any;
  const adminId = s.adminId ?? s.userId;
  const enrollments = await storage.getEnrollmentsByAdmin(adminId);
  res.json(enrollments);
});
enrollmentsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const bodySchema = api.enrollments.create.input.extend({
      studentId: z.coerce.number(),
      courseId: z.coerce.number(),
    });
    const input = bodySchema.parse(req.body);
    const existing = await storage.getEnrollmentByStudentAndCourse(
      input.studentId,
      input.courseId,
    );
    if (existing) {
      return res
        .status(409)
        .json({ message: "This student is already enrolled in this course." });
    }
    const enrollment = await storage.createEnrollment(input);
    res.status(201).json(enrollment);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({
        message: err.errors[0].message,
        field: err.errors[0].path.join("."),
      });
    throw err;
  }
});
enrollmentsRouter.delete("/:id", requireAuth, async (req, res) => {
  await storage.deleteEnrollment(Number(req.params.id));
  res.status(204).send();
});

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Auth (public endpoints: login/logout/me/register)
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
  app.use("/api/admin", adminRouter);
  app.use("/api/report-card", reportCardRouter);
  app.use("/api/plans", plansRouter);
  app.use("/api/automation", automationRouter);

  await seedDatabase().catch(console.error);

  return httpServer;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────
async function seedDatabase() {
  const existing = await storage.getUserByEmail("admin@badamsingh.com");
  if (existing) return; // already seeded

  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await storage.createUser({
    name: "Admin",
    email: "admin@badamsingh.com",
    passwordHash,
    role: "admin",
    permissions: [],
    branchId: null,
    isActive: true,
  } as any);

  const b1 = await storage.createBranch({
    name: "Main Branch",
    city: "Delhi",
    address: "123 Main St",
    phone: "9999999999",
    email: "main@zalgo.com",
    isActive: true,
  });
  const b2 = await storage.createBranch({
    name: "South Delhi Branch",
    city: "South Delhi",
    address: "456 South Ave",
    phone: "8888888888",
    email: "south@zalgo.com",
    isActive: true,
  });

  const c1 = await storage.createCourse({
    name: "JEE Main & Advanced",
    description: "Complete JEE preparation",
    duration: "2 Years",
    fee: 150000,
    status: "Active",
    branchId: b1.id,
  });
  const c2 = await storage.createCourse({
    name: "NEET UG",
    description: "Complete NEET preparation",
    duration: "2 Years",
    fee: 120000,
    status: "Active",
    branchId: b1.id,
  });

  const s1 = await storage.createStudent({
    enrollmentNo: "ENR-2026-001",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "9876543210",
    parentName: "Rajesh Sharma",
    parentPhone: "9876543211",
    address: "Delhi",
    status: "Active",
    branchId: b1.id,
  });
  const s2 = await storage.createStudent({
    enrollmentNo: "ENR-2026-002",
    name: "Rahul Verma",
    email: "rahul@example.com",
    phone: "9876543212",
    parentName: "Suresh Verma",
    parentPhone: "9876543213",
    address: "Noida",
    status: "Active",
    branchId: b2.id,
  });

  await storage.createFee({
    studentId: s1.id,
    courseId: c1.id,
    amountPaid: 50000,
    paymentMode: "Online",
    receiptNo: "RCP-2026-001",
    status: "Paid",
  });
  await storage.createFee({
    studentId: s2.id,
    courseId: c2.id,
    amountPaid: 30000,
    paymentMode: "Cash",
    receiptNo: "RCP-2026-002",
    status: "Paid",
  });

  const plan = await storage.createFeePlan({
    studentId: s1.id,
    courseId: c1.id,
    totalFee: 150000,
    discount: 10000,
    netFee: 140000,
    amountPaid: 50000,
    paymentType: "installment",
    installmentCount: 3,
    startDate: new Date(),
    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  for (let i = 1; i <= 3; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + (i - 1));
    await storage.createFeeInstallment({
      feePlanId: plan.id,
      studentId: s1.id,
      installmentNo: i,
      amount: Math.round(90000 / 3),
      dueDate,
      status: i === 1 ? "paid" : "pending",
      paidAmount: i === 1 ? 30000 : 0,
      paidDate: i === 1 ? new Date() : null,
    });
  }

  await storage.createTransaction({
    type: "Income",
    category: "Fee Collection",
    amount: 50000,
    description: "Priya Sharma Fee",
  });
  await storage.createTransaction({
    type: "Expense",
    category: "Salary",
    amount: 15000,
    description: "Teacher Salary Jan",
  });
  await storage.createInventory({
    itemName: "Whiteboard Markers",
    category: "Stationery",
    quantity: 50,
  });
  await storage.createInventory({
    itemName: "Projector",
    category: "Electronics",
    quantity: 2,
  });

  await storage.createNotification({
    title: "Fee Overdue",
    message: "Priya Sharma has an overdue installment of Rs 30,000",
    type: "warning",
    relatedId: s1.id,
    relatedType: "student",
  });

  console.log("[seed] Sample data seeded");
}
