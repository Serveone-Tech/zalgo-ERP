// server/controllers/courses.controller.ts — REPLACE
import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { z } from "zod";

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

export const CoursesController = {
  async list(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const courses = await storage.getCourses(adminId);
    res.json(courses);
  },

  async get(req: Request, res: Response) {
    const course = await storage.getCourse(Number(req.params.id));
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  },

  async students(req: Request, res: Response) {
    const results = await storage.getCourseStudents(Number(req.params.id));
    res.json(results);
  },

  async create(req: Request, res: Response) {
    try {
      const adminId = getAdminId(req);
      const bodySchema = api.courses.create.input.extend({
        fee: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      // adminId attach karo taaki course us admin ka ho
      const course = await storage.createCourse({ ...input, adminId } as any);
      res.status(201).json(course);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      throw err;
    }
  },

  async update(req: Request, res: Response) {
    try {
      const bodySchema = api.courses.update.input.extend({
        fee: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      const course = await storage.updateCourse(Number(req.params.id), input);
      res.json(course);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      throw err;
    }
  },

  async remove(req: Request, res: Response) {
    await storage.deleteCourse(Number(req.params.id));
    res.status(204).send();
  },
};
