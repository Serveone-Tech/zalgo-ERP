import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { parsePeriodToDateRange } from "../utils/period";
import { z } from "zod";

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

export const StudentsController = {
  async list(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const { period, from, to, branchId } = req.query as Record<string, string>;
    const { from: fromDate, to: toDate } = parsePeriodToDateRange(
      period,
      from,
      to,
    );
    const students = await storage.getStudents({
      branchId: branchId ? Number(branchId) : undefined,
      from: fromDate,
      to: toDate,
      adminId,
    });
    res.json(students);
  },

  async get(req: Request, res: Response) {
    const student = await storage.getStudent(Number(req.params.id));
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  },

  async create(req: Request, res: Response) {
    try {
      const input = api.students.create.input.parse(req.body);
      const student = await storage.createStudent(input);
      res.status(201).json(student);
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
      const input = api.students.update.input.parse(req.body);
      const student = await storage.updateStudent(Number(req.params.id), input);
      res.json(student);
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
    await storage.deleteStudent(Number(req.params.id));
    res.status(204).send();
  },
};
