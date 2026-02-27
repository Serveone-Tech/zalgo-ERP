import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
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
    // Parse date range filters
    const { period, from, to, branchId } = req.query as Record<string, string>;
    
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    
    if (period) {
      const now = new Date();
      toDate = now;
      switch (period) {
        case "today":
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "15days":
          fromDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          fromDate = new Date(now.getFullYear(), 0, 1);
          break;
        case "custom":
          fromDate = from ? new Date(from) : undefined;
          toDate = to ? new Date(to) : undefined;
          break;
      }
    }
    
    const branchFilter = branchId ? Number(branchId) : undefined;
    
    const stats = await storage.getDashboardStats({ from: fromDate, to: toDate, branchId: branchFilter });
    res.json(stats);
  },
};
