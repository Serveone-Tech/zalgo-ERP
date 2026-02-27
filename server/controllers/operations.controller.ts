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
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      throw err;
    }
  },
};

export const TransactionsController = {
  async list(req: Request, res: Response) {
    const results = await storage.getTransactions();
    res.json(results);
  },

  async create(req: Request, res: Response) {
    try {
      const bodySchema = api.transactions.create.input.extend({
        amount: z.coerce.number(),
        date: z.coerce.date().optional(),
      });
      const input = bodySchema.parse(req.body);
      const result = await storage.createTransaction(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
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
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      throw err;
    }
  },
};

export const DashboardController = {
  async stats(req: Request, res: Response) {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  },
};
