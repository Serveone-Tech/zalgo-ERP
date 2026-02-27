import { Router } from "express";
import { AssignmentsController, ExamsController } from "../controllers/academics.controller";

const assignmentsRouter = Router();
assignmentsRouter.get("/", AssignmentsController.list);
assignmentsRouter.post("/", AssignmentsController.create);

const examsRouter = Router();
examsRouter.get("/", ExamsController.list);
examsRouter.post("/", ExamsController.create);

export { assignmentsRouter, examsRouter };
