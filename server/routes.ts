import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Leads
  app.get(api.leads.list.path, async (req, res) => {
    const leads = await storage.getLeads();
    res.json(leads);
  });
  app.post(api.leads.create.path, async (req, res) => {
    try {
      const input = api.leads.create.input.parse(req.body);
      const lead = await storage.createLead(input);
      res.status(201).json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });
  app.put(api.leads.update.path, async (req, res) => {
    try {
      const input = api.leads.update.input.parse(req.body);
      const lead = await storage.updateLead(Number(req.params.id), input);
      res.json(lead);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });
  app.delete(api.leads.delete.path, async (req, res) => {
    await storage.deleteLead(Number(req.params.id));
    res.status(204).send();
  });

  // Students
  app.get(api.students.list.path, async (req, res) => {
    const students = await storage.getStudents();
    res.json(students);
  });
  app.get(api.students.get.path, async (req, res) => {
    const student = await storage.getStudent(Number(req.params.id));
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  });
  app.post(api.students.create.path, async (req, res) => {
    try {
      const input = api.students.create.input.parse(req.body);
      const student = await storage.createStudent(input);
      res.status(201).json(student);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });
  app.put(api.students.update.path, async (req, res) => {
    try {
      const input = api.students.update.input.parse(req.body);
      const student = await storage.updateStudent(Number(req.params.id), input);
      res.json(student);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });
  app.delete(api.students.delete.path, async (req, res) => {
    await storage.deleteStudent(Number(req.params.id));
    res.status(204).send();
  });

  // Teachers
  app.get(api.teachers.list.path, async (req, res) => {
    const teachers = await storage.getTeachers();
    res.json(teachers);
  });
  app.post(api.teachers.create.path, async (req, res) => {
    try {
      const input = api.teachers.create.input.parse(req.body);
      const teacher = await storage.createTeacher(input);
      res.status(201).json(teacher);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });
  app.put(api.teachers.update.path, async (req, res) => {
    try {
      const input = api.teachers.update.input.parse(req.body);
      const teacher = await storage.updateTeacher(Number(req.params.id), input);
      res.json(teacher);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });
  app.delete(api.teachers.delete.path, async (req, res) => {
    await storage.deleteTeacher(Number(req.params.id));
    res.status(204).send();
  });

  // Courses
  app.get(api.courses.list.path, async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });
  app.get(api.courses.students.path, async (req, res) => {
    const results = await storage.getCourseStudents(Number(req.params.id));
    res.json(results);
  });
  app.post(api.courses.create.path, async (req, res) => {
    try {
      const bodySchema = api.courses.create.input.extend({
        fee: z.coerce.number()
      });
      const input = bodySchema.parse(req.body);
      const course = await storage.createCourse(input);
      res.status(201).json(course);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });
  app.put(api.courses.update.path, async (req, res) => {
    try {
      const bodySchema = api.courses.update.input.extend({
        fee: z.coerce.number().optional()
      });
      const input = bodySchema.parse(req.body);
      const course = await storage.updateCourse(Number(req.params.id), input);
      res.json(course);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });
  app.delete(api.courses.delete.path, async (req, res) => {
    await storage.deleteCourse(Number(req.params.id));
    res.status(204).send();
  });

  // Enrollments
  app.get(api.enrollments.list.path, async (req, res) => {
    const enrollments = await storage.getEnrollments();
    res.json(enrollments);
  });
  app.post(api.enrollments.create.path, async (req, res) => {
    try {
      const bodySchema = api.enrollments.create.input.extend({
        studentId: z.coerce.number(),
        courseId: z.coerce.number()
      });
      const input = bodySchema.parse(req.body);
      const enrollment = await storage.createEnrollment(input);
      res.status(201).json(enrollment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });
  app.delete(api.enrollments.delete.path, async (req, res) => {
    await storage.deleteEnrollment(Number(req.params.id));
    res.status(204).send();
  });

  // Fees
  app.get(api.fees.list.path, async (req, res) => {
    const fees = await storage.getFees();
    res.json(fees);
  });
  app.post(api.fees.create.path, async (req, res) => {
    try {
      const bodySchema = api.fees.create.input.extend({
        studentId: z.coerce.number(),
        courseId: z.coerce.number(),
        amountPaid: z.coerce.number()
      });
      const input = bodySchema.parse(req.body);
      const fee = await storage.createFee(input);
      res.status(201).json(fee);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });
  app.delete(api.fees.delete.path, async (req, res) => {
    await storage.deleteFee(Number(req.params.id));
    res.status(204).send();
  });

  // Dashboard Stats
  app.get(api.dashboard.stats.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Assignments
  app.get(api.assignments.list.path, async (req, res) => {
    const results = await storage.getAssignments();
    res.json(results);
  });
  app.post(api.assignments.create.path, async (req, res) => {
    try {
      const bodySchema = api.assignments.create.input.extend({
        courseId: z.coerce.number(),
        dueDate: z.coerce.date().optional()
      });
      const input = bodySchema.parse(req.body);
      const result = await storage.createAssignment(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  // Exams
  app.get(api.exams.list.path, async (req, res) => {
    const results = await storage.getExams();
    res.json(results);
  });
  app.post(api.exams.create.path, async (req, res) => {
    try {
      const bodySchema = api.exams.create.input.extend({
        courseId: z.coerce.number(),
        date: z.coerce.date(),
        maxMarks: z.coerce.number()
      });
      const input = bodySchema.parse(req.body);
      const result = await storage.createExam(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  // Inventory
  app.get(api.inventory.list.path, async (req, res) => {
    const results = await storage.getInventory();
    res.json(results);
  });
  app.post(api.inventory.create.path, async (req, res) => {
    try {
      const bodySchema = api.inventory.create.input.extend({
        quantity: z.coerce.number()
      });
      const input = bodySchema.parse(req.body);
      const result = await storage.createInventory(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  // Transactions
  app.get(api.transactions.list.path, async (req, res) => {
    const results = await storage.getTransactions();
    res.json(results);
  });
  app.post(api.transactions.create.path, async (req, res) => {
    try {
      const bodySchema = api.transactions.create.input.extend({
        amount: z.coerce.number(),
        date: z.coerce.date().optional()
      });
      const input = bodySchema.parse(req.body);
      const result = await storage.createTransaction(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  // Communications
  app.get(api.communications.list.path, async (req, res) => {
    const results = await storage.getCommunications();
    res.json(results);
  });
  app.post(api.communications.send.path, async (req, res) => {
    try {
      const input = api.communications.send.input.parse(req.body);
      
      // MOCK sending logic
      console.log(`Sending ${input.type} to ${input.recipientType} ${input.recipientId}: ${input.content}`);
      
      const result = await storage.createCommunication(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  // Call the seed function
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
      status: "Active"
    });
    const c2 = await storage.createCourse({
      name: "NEET UG",
      description: "1 Year Dropper Batch",
      duration: "12 Months",
      fee: 90000,
      status: "Active"
    });

    await storage.createLead({
      studentName: "Rahul Kumar",
      parentName: "Sanjay Kumar",
      phone: "9876543210",
      courseInterested: "JEE Main & Advanced",
      status: "New"
    });

    const s1 = await storage.createStudent({
      enrollmentNo: "BSC2026-001",
      name: "Priya Sharma",
      email: "priya@example.com",
      phone: "9123456789",
      parentPhone: "9988776655",
      address: "123, Model Town, Delhi",
      status: "Active"
    });

    await storage.createTeacher({
      name: "Anil Desai",
      email: "anil.desai@badamsingh.com",
      phone: "9876123450",
      subject: "Physics",
      qualification: "M.Sc Physics, B.Ed",
      status: "Active"
    });

    await storage.createEnrollment({
      studentId: s1.id,
      courseId: c1.id
    });

    await storage.createFee({
      studentId: s1.id,
      courseId: c1.id,
      amountPaid: 50000,
      paymentMode: "Online",
      receiptNo: "RCP-2026-001",
      status: "Paid"
    });
  }
}
