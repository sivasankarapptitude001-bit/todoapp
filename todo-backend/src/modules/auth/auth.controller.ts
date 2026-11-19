import { NextFunction, Request, Response } from "express";
import { environment } from "../../config/environment";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.validation";

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  register = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const input = registerSchema.parse(request.body);
      const user = await this.authService.register(input);
      response.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const input = loginSchema.parse(request.body);
      const result = await this.authService.login(input);
      response.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: environment.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 1000
      });
      response.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  me = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.getUserById(request.authUser!.userId);
      response.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  logout = async (_request: Request, response: Response): Promise<void> => {
    response.clearCookie("accessToken", {
      httpOnly: true,
      secure: environment.NODE_ENV === "production",
      sameSite: "lax"
    });
    response.status(204).send();
  };
}
