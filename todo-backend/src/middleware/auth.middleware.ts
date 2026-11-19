import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { environment } from "../config/environment";
import { verifyAccessToken } from "../config/jwt";
import { AppError } from "../common/errors/AppError";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        userId: string;
        username: string;
      };
    }
  }
}

export const authenticate: RequestHandler = (request, _response, next) => {
  const bearerToken = request.headers.authorization?.startsWith("Bearer ")
    ? request.headers.authorization.slice(7)
    : undefined;
  const token = bearerToken || request.cookies?.accessToken;

  if (!token) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    request.authUser = { userId: payload.sub, username: payload.username };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, "UNAUTHORIZED", "Invalid or expired authentication token"));
      return;
    }
    next(error);
  }
};
