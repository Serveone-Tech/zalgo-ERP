import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { z } from "zod";

export const TeachersController = {
  async list(req: Request, res: Response) {
    const teachers = await storage.getTeachers();
    res.json(teachers);
  },

  async create(req: Request, res: Response) {
    try {
      const input = api.teachers.create.input.parse(req.body);
      const teacher = await storage.createTeacher(input);
      res.status(201).json(teacher);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
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
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      throw err;
    }
  },

  async remove(req: Request, res: Response) {
    await storage.deleteTeacher(Number(req.params.id));
    res.status(204).send();
  },
};
