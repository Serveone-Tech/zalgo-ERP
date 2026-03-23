import type { Request, Response } from "express";
import { storage } from "../storage";
import {
  insertFeePlanSchema,
  insertFeeInstallmentSchema,
} from "@shared/schema";
import { z } from "zod";

export const FeePlansController = {
  async list(req: Request, res: Response) {
    const studentId = req.query.studentId
      ? Number(req.query.studentId)
      : undefined;
    const branchId = req.query.branchId
      ? Number(req.query.branchId)
      : undefined;
    const plans = await storage.getFeePlans(studentId, branchId);
    res.json(plans);
  },

  async get(req: Request, res: Response) {
    const plan = await storage.getFeePlan(Number(req.params.id));
    if (!plan) return res.status(404).json({ message: "Fee plan not found" });
    res.json(plan);
  },

  async create(req: Request, res: Response) {
    try {
      const input = insertFeePlanSchema
        .extend({
          studentId: z.coerce.number(),
          courseId: z.coerce.number().optional().nullable(),
          totalFee: z.coerce.number(),
          discount: z.coerce.number().optional(),
          netFee: z.coerce.number(),
          amountPaid: z.coerce.number().optional(),
          installmentCount: z.coerce.number().optional(),
          installmentAmount: z.coerce.number().optional().nullable(),
          startDate: z.coerce.date().optional().nullable(),
          nextDueDate: z.coerce.date().optional().nullable(),
        })
        .parse(req.body);

      const plan = await storage.createFeePlan(input as any);

      // If installment plan, auto-create installment records
      if (
        input.paymentType === "installment" &&
        input.installmentCount &&
        input.installmentCount > 1
      ) {
        const amount = Math.round(
          (input.netFee - (input.amountPaid ?? 0)) / input.installmentCount,
        );
        const startDate = input.startDate
          ? new Date(input.startDate)
          : new Date();
        for (let i = 1; i <= input.installmentCount; i++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
          await storage.createFeeInstallment({
            feePlanId: plan.id,
            studentId: plan.studentId,
            installmentNo: i,
            amount,
            dueDate,
            status: "pending",
          });
        }
      }

      res.status(201).json(plan);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },

  async update(req: Request, res: Response) {
    try {
      const input = insertFeePlanSchema
        .partial()
        .extend({
          totalFee: z.coerce.number().optional(),
          discount: z.coerce.number().optional(),
          netFee: z.coerce.number().optional(),
          amountPaid: z.coerce.number().optional(),
          installmentCount: z.coerce.number().optional(),
          installmentAmount: z.coerce.number().optional().nullable(),
          startDate: z.coerce.date().optional().nullable(),
          nextDueDate: z.coerce.date().optional().nullable(),
        })
        .parse(req.body);
      const plan = await storage.updateFeePlan(
        Number(req.params.id),
        input as any,
      );
      res.json(plan);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },
};

export const FeeInstallmentsController = {
  async list(req: Request, res: Response) {
    const feePlanId = req.query.feePlanId
      ? Number(req.query.feePlanId)
      : undefined;
    const branchId = req.query.branchId
      ? Number(req.query.branchId)
      : undefined;
    const installments = await storage.getFeeInstallments(feePlanId, branchId);
    res.json(installments);
  },

  async getOverdue(req: Request, res: Response) {
    const overdue = await storage.getOverdueInstallments();
    res.json(overdue);
  },

  async pay(req: Request, res: Response) {
    try {
      const schema = z.object({
        paidAmount: z.coerce.number(),
        paymentMode: z.string(),
        receiptNo: z.string().optional(),
        paidDate: z.coerce.date().optional(),
      });
      const { paidAmount, paymentMode, receiptNo, paidDate } = schema.parse(
        req.body,
      );

      const finalReceiptNo = receiptNo ?? `RCP-${Date.now()}`;
      const finalPaidDate = paidDate ?? new Date();

      // ── 1. Installment update karo ─────────────────────────────────────────
      const inst = await storage.updateFeeInstallment(Number(req.params.id), {
        paidAmount,
        paymentMode,
        receiptNo: finalReceiptNo,
        paidDate: finalPaidDate,
        status: "paid",
      });

      // ── 2. Fee plan ka amountPaid update karo ──────────────────────────────
      const plan = await storage.getFeePlan(inst.feePlanId);
      if (plan) {
        const allInst = await storage.getFeeInstallments(inst.feePlanId);
        const totalPaid = allInst.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
        await storage.updateFeePlan(inst.feePlanId, { amountPaid: totalPaid });
      }

      // ── 3. Fees table mein entry banao (Payments tab mein dikhne ke liye) ──
      try {
        const student = await storage.getStudent(inst.studentId);

        // courseId fee plan se lo, agar nahi hai toh 0 (default fallback)
        const courseId = plan?.courseId ?? null;

        if (courseId) {
          await storage.createFee({
            studentId: inst.studentId,
            courseId,
            amountPaid: paidAmount,
            paymentMode,
            receiptNo: finalReceiptNo,
            status: "Paid",
            branchId: student?.branchId ?? null,
          });
        }
      } catch (feeErr) {
        console.error(
          "[FeeInstallmentsController] Fee record creation failed:",
          feeErr,
        );
      }

      // ── 4. Transaction bhi create karo (Income/Expense tab mein dikhne ke liye) ──
      try {
        const student = await storage.getStudent(inst.studentId);
        const studentName = student?.name ?? `Student #${inst.studentId}`;

        await storage.createTransaction({
          type: "Income",
          category: "Fee Collection",
          amount: paidAmount,
          description: `Installment #${inst.installmentNo} from ${studentName} | Receipt: ${finalReceiptNo}`,
          branchId: student?.branchId ?? null,
        });
      } catch (txErr) {
        console.error(
          "[FeeInstallmentsController] Transaction creation failed:",
          txErr,
        );
      }
      // ──────────────────────────────────────────────────────────────────────

      console.log(
        `[WhatsApp Mock] Fee payment recorded for student ${inst.studentId}: ₹${paidAmount}`,
      );

      res.json(inst);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  },
};
