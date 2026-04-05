
import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { parsePeriodToDateRange } from "../utils/period";
import { z } from "zod";

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

export const TeachersController = {
  async list(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const { period, from, to, branchId } = req.query as Record<string, string>;
    const { from: fromDate, to: toDate } = parsePeriodToDateRange(
      period,
      from,
      to,
    );
    const teachers = await storage.getTeachers({
      branchId: branchId ? Number(branchId) : undefined,
      from: fromDate,
      to: toDate,
      adminId,
    });
    res.json(teachers);
  },

  async get(req: Request, res: Response) {
    const teacher = await storage.getTeacher(Number(req.params.id));
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(teacher);
  },

  async create(req: Request, res: Response) {
    try {
      const input = api.teachers.create.input.parse(req.body);
      const teacher = await storage.createTeacher(input);
      res.status(201).json(teacher);
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

  async update(req: Request, res: Response) {
    try {
      const input = api.teachers.update.input.parse(req.body);
      const teacher = await storage.updateTeacher(Number(req.params.id), input);
      res.json(teacher);
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

  async remove(req: Request, res: Response) {
    await storage.deleteTeacher(Number(req.params.id));
    res.status(204).send();
  },
};
