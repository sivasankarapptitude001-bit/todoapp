import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { TaskController } from "./task.controller";

const router = Router();
const controller = new TaskController();

router.use(authenticate);
router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.put("/:id", controller.updateName);
router.patch("/:id/completion", controller.setCompletion);
router.delete("/:id", controller.delete);

export { router as taskRoutes };
