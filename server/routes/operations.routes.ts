import { Router } from "express";
import { InventoryController, TransactionsController, CommunicationsController, DashboardController } from "../controllers/operations.controller";
import { requireAuth, requirePermission } from "../controllers/auth.controller";

const inventoryRouter = Router();
const invPerm = requirePermission("inventory");
inventoryRouter.get("/", requireAuth, invPerm, InventoryController.list);
inventoryRouter.post("/", requireAuth, invPerm, InventoryController.create);

const transactionsRouter = Router();
const txPerm = requirePermission("transactions");
transactionsRouter.get("/", requireAuth, txPerm, TransactionsController.list);
transactionsRouter.post("/", requireAuth, txPerm, TransactionsController.create);

const communicationsRouter = Router();
const commPerm = requirePermission("communications");
communicationsRouter.get("/", requireAuth, commPerm, CommunicationsController.list);
communicationsRouter.post("/send", requireAuth, commPerm, CommunicationsController.send);

const dashboardRouter = Router();
dashboardRouter.get("/stats", requireAuth, DashboardController.stats);

export { inventoryRouter, transactionsRouter, communicationsRouter, dashboardRouter };
