import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../common/errors/AppError";

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: error.issues[0]?.message || "Invalid request" }
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message }
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    success: false,
    error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" }
  });
};
