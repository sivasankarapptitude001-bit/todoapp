import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { environment } from "./config/environment";
import { sequelize } from "./config/database";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { taskRoutes } from "./modules/tasks/task.routes";

export const app = express();

app.use(cors({
  origin: environment.FRONTEND_URL,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.get("/health", async (_request, response, next) => {
  try {
    await sequelize.authenticate();
    response.status(200).json({
      success: true,
      data: { status: "healthy", database: "connected" }
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
