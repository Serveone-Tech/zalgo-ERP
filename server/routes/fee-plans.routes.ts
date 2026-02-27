import { Router } from "express";
import { FeePlansController, FeeInstallmentsController } from "../controllers/fee-plans.controller";
import { requireAuth } from "../controllers/auth.controller";

const feePlansRouter = Router();
feePlansRouter.get("/", requireAuth, FeePlansController.list);
feePlansRouter.get("/:id", requireAuth, FeePlansController.get);
feePlansRouter.post("/", requireAuth, FeePlansController.create);
feePlansRouter.put("/:id", requireAuth, FeePlansController.update);

const feeInstallmentsRouter = Router();
feeInstallmentsRouter.get("/", requireAuth, FeeInstallmentsController.list);
feeInstallmentsRouter.get("/overdue", requireAuth, FeeInstallmentsController.getOverdue);
feeInstallmentsRouter.post("/:id/pay", requireAuth, FeeInstallmentsController.pay);

export { feePlansRouter, feeInstallmentsRouter };
