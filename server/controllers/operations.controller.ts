import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { parsePeriodToDateRange } from "../utils/period";
import { z } from "zod";

export const InventoryController = {
  async list(req: Request, res: Response) {
    const results = await storage.getInventory();
    res.json(results);
  },
  async create(req: Request, res: Response) {
    try {
      const bodySchema = api.inventory.create.input.extend({ quantity: z.coerce.number() });
      const input = bodySchema.parse(req.body);
      const result = await storage.createInventory(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },
};

export const TransactionsController = {
  async list(req: Request, res: Response) {
    const branchId = req.query.branchId ? Number(req.query.branchId) : undefined;
    const results = await storage.getTransactions(branchId);
    res.json(results);
  },
  async create(req: Request, res: Response) {
    try {
      const bodySchema = api.transactions.create.input.extend({
        amount: z.coerce.number(),
        date: z.coerce.date().optional(),
        branchId: z.coerce.number().optional().nullable(),
      });
      const input = bodySchema.parse(req.body);
      const result = await storage.createTransaction(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  async remove(req: Request, res: Response) {
    await storage.deleteTransaction(Number(req.params.id));
    res.status(204).send();
  },
};

export const CommunicationsController = {
  async list(req: Request, res: Response) {
    const results = await storage.getCommunications();
    res.json(results);
  },
  async send(req: Request, res: Response) {
    try {
      const input = api.communications.send.input.parse(req.body);

      if (input.recipientType === "Bulk" && input.courseId) {
        const students = await storage.getCourseStudents(input.courseId);
        console.log(`[Bulk] Sending ${input.type} to ${students.length} students in course ${input.courseId}`);
      } else {
        console.log(`[Single] Sending ${input.type} to ${input.recipientType} ${input.recipientId}`);
      }

      const result = await storage.createCommunication({
        recipientId: input.recipientId || 0,
        recipientType: input.recipientType,
        type: input.type,
        subject: input.subject || null,
        content: input.content,
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },
};

export const DashboardController = {
  async stats(req: Request, res: Response) {
    const { period, from, to, branchId } = req.query as Record<string, string>;
    const { from: fromDate, to: toDate } = parsePeriodToDateRange(period, from, to);
    const branchFilter = branchId ? Number(branchId) : undefined;
    const stats = await storage.getDashboardStats({ from: fromDate, to: toDate, branchId: branchFilter });
    res.json(stats);
  },
};
