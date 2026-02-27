import { Router } from "express";
import { AssignmentsController, ExamsController } from "../controllers/academics.controller";
import { requireAuth } from "../controllers/auth.controller";

const assignmentsRouter = Router();
assignmentsRouter.get("/", requireAuth, AssignmentsController.list);
assignmentsRouter.post("/", requireAuth, AssignmentsController.create);

const examsRouter = Router();
examsRouter.get("/", requireAuth, ExamsController.list);
examsRouter.post("/", requireAuth, ExamsController.create);

export { assignmentsRouter, examsRouter };
