// server/controllers/fees.controller.ts — REPLACE
import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { parsePeriodToDateRange } from "../utils/period";
import { z } from "zod";

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

export const FeesController = {
  async list(req: Request, res: Response) {
    const adminId = getAdminId(req);
    const { period, from, to, branchId } = req.query as Record<string, string>;
    const { from: fromDate, to: toDate } = parsePeriodToDateRange(
      period,
      from,
      to,
    );
    const fees = await storage.getFees({
      branchId: branchId ? Number(branchId) : undefined,
      from: fromDate,
      to: toDate,
      adminId,
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

      // Auto-create Income transaction
      try {
        const student = await storage.getStudent(input.studentId);
        const studentName = student?.name ?? `Student #${input.studentId}`;
        await storage.createTransaction({
          type: "Income",
          category: "Fee Collection",
          amount: input.amountPaid,
          description: `Fee collected from ${studentName} | Receipt: ${input.receiptNo}`,
          branchId: input.branchId ?? student?.branchId ?? null,
        });
      } catch (txErr) {
        console.error(
          "[FeesController] Auto-transaction creation failed:",
          txErr,
        );
      }

      res.status(201).json(fee);
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
    await storage.deleteFee(Number(req.params.id));
    res.status(204).send();
  },
};
