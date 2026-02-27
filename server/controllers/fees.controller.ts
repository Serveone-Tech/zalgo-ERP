import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { parsePeriodToDateRange } from "../utils/period";
import { z } from "zod";

export const FeesController = {
  async list(req: Request, res: Response) {
    const { period, from, to, branchId } = req.query as Record<string, string>;
    const { from: fromDate, to: toDate } = parsePeriodToDateRange(period, from, to);
    const fees = await storage.getFees({
      branchId: branchId ? Number(branchId) : undefined,
      from: fromDate,
      to: toDate,
    });
    res.json(fees);
  },

  async create(req: Request, res: Response) {
    try {
      const bodySchema = api.fees.create.input.extend({
        studentId: z.coerce.number(),
        courseId: z.coerce.number(),
        amountPaid: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const fee = await storage.createFee(input);
      res.status(201).json(fee);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      throw err;
    }
  },

  async remove(req: Request, res: Response) {
    await storage.deleteFee(Number(req.params.id));
    res.status(204).send();
  },
};
