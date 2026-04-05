// server/controllers/branches.controller.ts — REPLACE
import type { Request, Response } from "express";
import { storage } from "../storage";
import { insertBranchSchema } from "@shared/schema";
import { z } from "zod";

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

export const BranchesController = {
  async list(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const list = await storage.getBranches(adminId);
    res.json(list);
  },

  async create(req: Request, res: Response) {
    try {
      const adminId = getAdminId(req);
      const input = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch({ ...input, adminId } as any);
      res.status(201).json(branch);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  async update(req: Request, res: Response) {
    try {
      const input = insertBranchSchema.partial().parse(req.body);
      const branch = await storage.updateBranch(Number(req.params.id), input);
      res.json(branch);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  async remove(req: Request, res: Response) {
    await storage.deleteBranch(Number(req.params.id));
    res.status(204).send();
  },
};
