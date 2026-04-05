
import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { parsePeriodToDateRange } from "../utils/period";
import { z } from "zod";
import { sendMessage } from "server/utils/messaging.service";

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

export const InventoryController = {
  list: async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const results = await storage.getInventory(adminId);
    res.json(results);
  },

  create: async (req: Request, res: Response) => {
    try {
      const bodySchema = api.inventory.create.input.extend({
        quantity: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      const result = await storage.createInventory(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const bodySchema = z.object({
        itemName: z.string().optional(),
        category: z.string().nullable().optional(),
        quantity: z.coerce.number().optional(),
        branchId: z.coerce.number().nullable().optional(),
      });
      const input = bodySchema.parse(req.body);
      const result = await storage.updateInventory(id, input);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  remove: async (req: Request, res: Response) => {
    await storage.deleteInventory(Number(req.params.id));
    res.status(204).send();
  },
};

export const TransactionsController = {
  list: async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const branchId = req.query.branchId
      ? Number(req.query.branchId)
      : undefined;
    const results = await storage.getTransactions(branchId, adminId);
    res.json(results);
  },

  create: async (req: Request, res: Response) => {
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
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  remove: async (req: Request, res: Response) => {
    await storage.deleteTransaction(Number(req.params.id));
    res.status(204).send();
  },
};

export const CommunicationsController = {
  list: async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const results = await storage.getCommunications(adminId);
    res.json(results);
  },

  send: async (req: Request, res: Response) => {
    try {
      const adminId = getAdminId(req);
      const input = api.communications.send.input.parse(req.body);
      const results: { recipient: string; success: boolean; error?: string }[] =
        [];

      if (input.recipientType === "Bulk" && input.courseId) {
        const courseStudents = await storage.getCourseStudents(input.courseId);
        for (const { student } of courseStudents) {
          let to = "";
          if (input.type === "Email") to = student.email || "";
          else to = student.phone || "";
          if (!to) {
            results.push({
              recipient: student.name,
              success: false,
              error: "No contact info",
            });
            continue;
          }
          const result = await sendMessage({
            type: input.type as "Email" | "SMS" | "WhatsApp",
            to,
            subject: input.subject || undefined,
            content: input.content,
          });
          results.push({ recipient: student.name, ...result });
        }
      } else if (input.recipientType === "Student" && input.recipientId) {
        const student = await storage.getStudent(input.recipientId);
        if (!student)
          return res.status(404).json({ message: "Student not found" });
        const to =
          input.type === "Email" ? student.email || "" : student.phone || "";
        if (!to)
          return res
            .status(400)
            .json({
              message: `Student has no ${input.type === "Email" ? "email" : "phone"} saved`,
            });
        const result = await sendMessage({
          type: input.type as "Email" | "SMS" | "WhatsApp",
          to,
          subject: input.subject || undefined,
          content: input.content,
        });
        results.push({ recipient: student.name, ...result });
      } else if (input.recipientType === "Parent" && input.recipientId) {
        const student = await storage.getStudent(input.recipientId);
        if (!student)
          return res.status(404).json({ message: "Student not found" });
        const to =
          input.type === "Email"
            ? student.email || ""
            : student.parentPhone || "";
        if (!to)
          return res
            .status(400)
            .json({ message: "Parent has no contact info saved" });
        const result = await sendMessage({
          type: input.type as "Email" | "SMS" | "WhatsApp",
          to,
          subject: input.subject || undefined,
          content: input.content,
        });
        results.push({ recipient: student.parentName || "Parent", ...result });
      } else if (input.recipientType === "Teacher" && input.recipientId) {
        const teacher = await storage.getTeacher(input.recipientId);
        if (!teacher)
          return res.status(404).json({ message: "Teacher not found" });
        const to =
          input.type === "Email" ? teacher.email || "" : teacher.phone || "";
        if (!to)
          return res
            .status(400)
            .json({ message: "Teacher has no contact info saved" });
        const result = await sendMessage({
          type: input.type as "Email" | "SMS" | "WhatsApp",
          to,
          subject: input.subject || undefined,
          content: input.content,
        });
        results.push({ recipient: teacher.name, ...result });
      }

      await storage.createCommunication({
        recipientId: input.recipientId || 0,
        recipientType: input.recipientType,
        type: input.type,
        subject: input.subject || null,
        content: input.content,
        adminId,
      } as any);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;
      res.status(201).json({
        message:
          failCount === 0
            ? `Message sent successfully to ${successCount} recipient(s)`
            : `Sent: ${successCount}, Failed: ${failCount}`,
        results,
        successCount,
        failCount,
      });
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },
};

export const DashboardController = {
  stats: async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const { period, from, to, branchId } = req.query as Record<string, string>;
    const { from: fromDate, to: toDate } = parsePeriodToDateRange(
      period,
      from,
      to,
    );
    const branchFilter = branchId ? Number(branchId) : undefined;
    const stats = await storage.getDashboardStats({
      from: fromDate,
      to: toDate,
      branchId: branchFilter,
      adminId,
    });
    res.json(stats);
  },
};
