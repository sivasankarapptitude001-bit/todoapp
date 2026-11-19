import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { AuthController } from "./auth.controller";

const router = Router();
const controller = new AuthController();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.get("/me", authenticate, controller.me);

export { router as authRoutes };
