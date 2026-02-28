import { Router } from "express";
import { AssignmentsController, ExamsController } from "../controllers/academics.controller";
import { requireAuth, requirePermission } from "../controllers/auth.controller";

const assignmentsRouter = Router();
const assignPerm = requirePermission("assignments");
assignmentsRouter.get("/", requireAuth, assignPerm, AssignmentsController.list);
assignmentsRouter.post("/", requireAuth, assignPerm, AssignmentsController.create);

const examsRouter = Router();
const examPerm = requirePermission("exams");
examsRouter.get("/", requireAuth, examPerm, ExamsController.list);
examsRouter.post("/", requireAuth, examPerm, ExamsController.create);

export { assignmentsRouter, examsRouter };
