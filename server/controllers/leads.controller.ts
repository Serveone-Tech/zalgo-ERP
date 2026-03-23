import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { parsePeriodToDateRange } from "../utils/period";
import { z } from "zod";

export const LeadsController = {
  async list(req: Request, res: Response) {
    const { period, from, to, branchId } = req.query as Record<string, string>;
    const { from: fromDate, to: toDate } = parsePeriodToDateRange(
      period,
      from,
      to,
    );
    const leads = await storage.getLeads({
      branchId: branchId ? Number(branchId) : undefined,
      from: fromDate,
      to: toDate,
    });
    res.json(leads);
  },

  async get(req: Request, res: Response) {
    const lead = await storage.getLead(Number(req.params.id));
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  },

  async create(req: Request, res: Response) {
    try {
      const input = api.leads.create.input.parse(req.body);
      const lead = await storage.createLead(input);
      res.status(201).json(lead);
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
      const input = api.leads.update.input.parse(req.body);
      const leadId = Number(req.params.id);

      // ── Auto-create student when lead is marked Converted ──────────────────
      if (input.status === "Converted") {
        const existingLead = await storage.getLead(leadId);

        if (existingLead && existingLead.status !== "Converted") {
          const existingStudents = await storage.getStudents({});
          const alreadyExists = existingStudents.some(
            (s) => s.phone === existingLead.phone,
          );

          if (!alreadyExists) {
            await storage.createStudent({
              enrollmentNo: `BSC${Date.now()}-${Math.floor(Math.random() * 999)}`,
              name: existingLead.studentName,
              email: null,
              phone: existingLead.phone,
              parentName: existingLead.parentName ?? "",
              parentPhone: existingLead.parentPhone ?? "",
              address: existingLead.address ?? null,
              profilePicture: null,
              status: "Active",
              branchId: existingLead.branchId ?? null,
              courseInterested: existingLead.courseInterested ?? null, // ✅ lead ka course bhi copy hoga
            });
          }
        }
      }
      // ──────────────────────────────────────────────────────────────────────

      const lead = await storage.updateLead(leadId, input);
      res.json(lead);
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
    await storage.deleteLead(Number(req.params.id));
    res.status(204).send();
  },
};
