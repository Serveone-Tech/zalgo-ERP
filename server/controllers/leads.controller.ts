import type { Request, Response } from "express";
import { storage } from "../storage";
import { api } from "@shared/routes";
import { z } from "zod";

export const LeadsController = {
  async list(req: Request, res: Response) {
    const leads = await storage.getLeads();
    res.json(leads);
  },

  async create(req: Request, res: Response) {
    try {
      const input = api.leads.create.input.parse(req.body);
      const lead = await storage.createLead(input);
      res.status(201).json(lead);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      throw err;
    }
  },

  async update(req: Request, res: Response) {
    try {
      const input = api.leads.update.input.parse(req.body);
      const lead = await storage.updateLead(Number(req.params.id), input);
      res.json(lead);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      throw err;
    }
  },

  async remove(req: Request, res: Response) {
    await storage.deleteLead(Number(req.params.id));
    res.status(204).send();
  },
};
