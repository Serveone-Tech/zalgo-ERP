// server/controllers/leads.controller.ts — REPLACE
import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { parsePeriodToDateRange } from "../utils/period";
import { z } from "zod";
import {
  triggerNewLead,
  triggerLeadConverted,
} from "../utils/automation-trigger";
import { db } from "../db";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";

function getAdminId(req: Request): number {
  const s = req.session as any;
  return s.adminId ?? s.userId;
}

async function getInstituteName(adminId: number): Promise<string> {
  try {
    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.userId, adminId));
    return org?.name || "Your Institute";
  } catch {
    return "Your Institute";
  }
}

export const LeadsController = {
  async list(req: Request, res: Response) {
    const adminId = getAdminId(req);
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
      adminId,
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
      const adminId = getAdminId(req);
      const input = api.leads.create.input.parse(req.body);
      const lead = await storage.createLead({ ...input, adminId } as any);
      res.status(201).json(lead);

      // Fire automation — non-blocking (response already sent)
      getInstituteName(adminId).then((instituteName) => {
        triggerNewLead(adminId, {
          studentName: lead.studentName,
          phone: lead.phone,
          email: (lead as any).email || null,
          courseInterested: lead.courseInterested,
          instituteName,
        }).catch((e) =>
          console.error("[Automation] new_lead failed:", e.message),
        );
      });
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      throw err;
    }
  },

  async update(req: Request, res: Response) {
    try {
      const adminId = getAdminId(req);
      const input = api.leads.update.input.parse(req.body);
      const leadId = Number(req.params.id);

      // Auto-create student when lead is marked Converted
      if (input.status === "Converted") {
        const existingLead = await storage.getLead(leadId);
        if (existingLead && existingLead.status !== "Converted") {
          const existingStudents = await storage.getStudents({ adminId });
          const alreadyExists = existingStudents.some(
            (s) => s.phone === existingLead.phone,
          );

          if (!alreadyExists) {
            const newStudent = await storage.createStudent({
              enrollmentNo: `ZIC${Date.now()}-${Math.floor(Math.random() * 999)}`,
              name: existingLead.studentName,
              email: null,
              phone: existingLead.phone,
              parentName: existingLead.parentName ?? "",
              parentPhone: existingLead.parentPhone ?? "",
              address: existingLead.address ?? null,
              profilePicture: null,
              status: "Active",
              branchId: existingLead.branchId ?? null,
              courseInterested: existingLead.courseInterested ?? null,
              adminId,
            } as any);

            // Fire lead_converted trigger — non-blocking
            getInstituteName(adminId).then((instituteName) => {
              triggerLeadConverted(adminId, {
                name: newStudent.name,
                phone: newStudent.phone,
                email: newStudent.email,
                courseInterested: newStudent.courseInterested,
                instituteName,
              }).catch((e) =>
                console.error("[Automation] lead_converted failed:", e.message),
              );
            });
          }
        }
      }

      const lead = await storage.updateLead(leadId, input);
      res.json(lead);
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
    await storage.deleteLead(Number(req.params.id));
    res.status(204).send();
  },
};
