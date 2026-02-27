import { Router } from "express";
import {
  InventoryController,
  TransactionsController,
  CommunicationsController,
  DashboardController,
} from "../controllers/operations.controller";

const inventoryRouter = Router();
inventoryRouter.get("/", InventoryController.list);
inventoryRouter.post("/", InventoryController.create);

const transactionsRouter = Router();
transactionsRouter.get("/", TransactionsController.list);
transactionsRouter.post("/", TransactionsController.create);

const communicationsRouter = Router();
communicationsRouter.get("/", CommunicationsController.list);
communicationsRouter.post("/send", CommunicationsController.send);

const dashboardRouter = Router();
dashboardRouter.get("/stats", DashboardController.stats);

export { inventoryRouter, transactionsRouter, communicationsRouter, dashboardRouter };
