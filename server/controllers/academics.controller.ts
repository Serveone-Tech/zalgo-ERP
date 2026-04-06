// server/controllers/academics.controller.ts — REPLACE
import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { z } from "zod";

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

export const AssignmentsController = {
  async list(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const results = await storage.getAssignments(adminId);
    res.json(results);
  },

  async create(req: Request, res: Response) {
    try {
      const bodySchema = api.assignments.create.input.extend({
        courseId: z.coerce.number(),
        dueDate: z.coerce.date().optional(),
      });
      const input = bodySchema.parse(req.body);
      const result = await storage.createAssignment(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res
          .status(400)
          .json({
            message: err.errors[0].message,
            field: err.errors[0].path.join("."),
          });
      throw err;
    }
  },
};

export const ExamsController = {
  async list(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const results = await storage.getExams(adminId);
    res.json(results);
  },

  async create(req: Request, res: Response) {
    try {
      const bodySchema = api.exams.create.input.extend({
        courseId: z.coerce.number(),
        date: z.coerce.date(),
        maxMarks: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const result = await storage.createExam(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res
          .status(400)
          .json({
            message: err.errors[0].message,
            field: err.errors[0].path.join("."),
          });
      throw err;
    }
  },
};
