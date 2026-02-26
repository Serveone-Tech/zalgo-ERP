import { db } from "./db";
import {
  leads, students, teachers, courses, enrollments, fees,
  type InsertLead, type InsertStudent, type InsertTeacher, type InsertCourse, type InsertEnrollment, type InsertFee,
  type Lead, type Student, type Teacher, type Course, type Enrollment, type Fee
} from "@shared/schema";
import { eq, count } from "drizzle-orm";

export interface IStorage {
  // Leads
  getLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: number): Promise<void>;

  // Students
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;

  // Teachers
  getTeachers(): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher>;
  deleteTeacher(id: number): Promise<void>;

  // Courses
  getCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;

  // Enrollments
  getEnrollments(): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  deleteEnrollment(id: number): Promise<void>;

  // Fees
  getFees(): Promise<Fee[]>;
  createFee(fee: InsertFee): Promise<Fee>;
  deleteFee(id: number): Promise<void>;
  
  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalStudents: number;
    activeLeads: number;
    totalTeachers: number;
    totalRevenue: number;
    recentLeads: Lead[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // Leads
  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(leads.createdAt);
  }
  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }
  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead> {
    const [updatedLead] = await db.update(leads).set(updates).where(eq(leads.id, id)).returning();
    return updatedLead;
  }
  async deleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  // Students
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(students.createdAt);
  }
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }
  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }
  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student> {
    const [updatedStudent] = await db.update(students).set(updates).where(eq(students.id, id)).returning();
    return updatedStudent;
  }
  async deleteStudent(id: number): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers).orderBy(teachers.createdAt);
  }
  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [newTeacher] = await db.insert(teachers).values(teacher).returning();
    return newTeacher;
  }
  async updateTeacher(id: number, updates: Partial<InsertTeacher>): Promise<Teacher> {
    const [updatedTeacher] = await db.update(teachers).set(updates).where(eq(teachers.id, id)).returning();
    return updatedTeacher;
  }
  async deleteTeacher(id: number): Promise<void> {
    await db.delete(teachers).where(eq(teachers.id, id));
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }
  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }
  async updateCourse(id: number, updates: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db.update(courses).set(updates).where(eq(courses.id, id)).returning();
    return updatedCourse;
  }
  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Enrollments
  async getEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments);
  }
  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }
  async deleteEnrollment(id: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.id, id));
  }

  // Fees
  async getFees(): Promise<Fee[]> {
    return await db.select().from(fees);
  }
  async createFee(fee: InsertFee): Promise<Fee> {
    const [newFee] = await db.insert(fees).values(fee).returning();
    return newFee;
  }
  async deleteFee(id: number): Promise<void> {
    await db.delete(fees).where(eq(fees.id, id));
  }

  // Dashboard Stats
  async getDashboardStats() {
    const [studentsResult] = await db.select({ count: count() }).from(students);
    const [leadsResult] = await db.select({ count: count() }).from(leads).where(eq(leads.status, "New"));
    const [teachersResult] = await db.select({ count: count() }).from(teachers);
    
    // Calculate total revenue
    const allFees = await db.select().from(fees);
    const totalRevenue = allFees.reduce((sum, fee) => sum + fee.amountPaid, 0);

    const recentLeads = await db.select().from(leads).orderBy(leads.createdAt).limit(5);

    return {
      totalStudents: studentsResult.count,
      activeLeads: leadsResult.count,
      totalTeachers: teachersResult.count,
      totalRevenue,
      recentLeads
    };
  }
}

export const storage = new DatabaseStorage();
