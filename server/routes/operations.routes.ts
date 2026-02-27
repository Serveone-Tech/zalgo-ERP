import { Router } from "express";
import { InventoryController, TransactionsController, CommunicationsController, DashboardController } from "../controllers/operations.controller";
import { requireAuth } from "../controllers/auth.controller";

const inventoryRouter = Router();
inventoryRouter.get("/", requireAuth, InventoryController.list);
inventoryRouter.post("/", requireAuth, InventoryController.create);

const transactionsRouter = Router();
transactionsRouter.get("/", requireAuth, TransactionsController.list);
transactionsRouter.post("/", requireAuth, TransactionsController.create);

const communicationsRouter = Router();
communicationsRouter.get("/", requireAuth, CommunicationsController.list);
communicationsRouter.post("/send", requireAuth, CommunicationsController.send);

const dashboardRouter = Router();
dashboardRouter.get("/stats", requireAuth, DashboardController.stats);

export { inventoryRouter, transactionsRouter, communicationsRouter, dashboardRouter };
