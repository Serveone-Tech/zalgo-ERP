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

// Enrollments (inline — simple CRUD)
import { z } from "zod";
import { api } from "@shared/routes";
import { Router } from "express";

const enrollmentsRouter = Router();
enrollmentsRouter.get("/", async (req, res) => {
  const enrollments = await storage.getEnrollments();
  res.json(enrollments);
});
enrollmentsRouter.post("/", async (req, res) => {
  try {
    const bodySchema = api.enrollments.create.input.extend({
      studentId: z.coerce.number(),
      courseId: z.coerce.number(),
    });
    const input = bodySchema.parse(req.body);
    const enrollment = await storage.createEnrollment(input);
    res.status(201).json(enrollment);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
    throw err;
  }
});
enrollmentsRouter.delete("/:id", async (req, res) => {
  await storage.deleteEnrollment(Number(req.params.id));
  res.status(204).send();
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use("/api/leads", leadsRouter);
  app.use("/api/students", studentsRouter);
  app.use("/api/teachers", teachersRouter);
  app.use("/api/courses", coursesRouter);
  app.use("/api/enrollments", enrollmentsRouter);
  app.use("/api/fees", feesRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/exams", examsRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/communications", communicationsRouter);
  app.use("/api/dashboard", dashboardRouter);

  await seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existingCourses = await storage.getCourses();
  if (existingCourses.length === 0) {
    const c1 = await storage.createCourse({
      name: "JEE Main & Advanced",
      description: "2 Year Classroom Program for Class 11",
      duration: "24 Months",
      fee: 150000,
      status: "Active",
    });
    const c2 = await storage.createCourse({
      name: "NEET UG",
      description: "1 Year Dropper Batch",
      duration: "12 Months",
      fee: 90000,
      status: "Active",
    });

    await storage.createLead({
      studentName: "Rahul Kumar",
      parentName: "Sanjay Kumar",
      phone: "9876543210",
      courseInterested: "JEE Main & Advanced",
      status: "New",
    });

    const s1 = await storage.createStudent({
      enrollmentNo: "BSC2026-001",
      name: "Priya Sharma",
      email: "priya@example.com",
      phone: "9123456789",
      parentName: "Ramesh Sharma",
      parentPhone: "9988776655",
      address: "123, Model Town, Delhi",
      status: "Active",
    });

    await storage.createTeacher({
      name: "Anil Desai",
      email: "anil.desai@badamsingh.com",
      phone: "9876123450",
      subject: "Physics",
      qualification: "M.Sc Physics, B.Ed",
      status: "Active",
    });

    await storage.createEnrollment({ studentId: s1.id, courseId: c1.id });

    await storage.createFee({
      studentId: s1.id,
      courseId: c1.id,
      amountPaid: 50000,
      paymentMode: "Online",
      receiptNo: "RCP-2026-001",
      status: "Paid",
    });

    await storage.createTransaction({ type: "Income", category: "Fee Collection", amount: 50000, description: "Priya Sharma Fee" });
    await storage.createTransaction({ type: "Expense", category: "Salary", amount: 15000, description: "Teacher Salary Jan" });
    await storage.createInventory({ itemName: "Whiteboard Markers", category: "Stationery", quantity: 50 });
    await storage.createInventory({ itemName: "Projector", category: "Electronics", quantity: 2 });
  }
}
