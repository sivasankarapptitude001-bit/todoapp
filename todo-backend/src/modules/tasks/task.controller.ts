import { NextFunction, Request, Response } from "express";
import {
  taskCompletionSchema,
  taskIdSchema,
  taskNameSchema
} from "./task.validation";
import { TaskService } from "./task.service";

export class TaskController {
  constructor(private readonly tasks = new TaskService()) {}

  create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const input = taskNameSchema.parse(request.body);
      const task = await this.tasks.create(request.authUser!.userId, input);
      response.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  list = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const tasks = await this.tasks.list(request.authUser!.userId);
      response.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  };

  get = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = taskIdSchema.parse(request.params);
      const task = await this.tasks.get(request.authUser!.userId, id);
      response.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  updateName = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = taskIdSchema.parse(request.params);
      const input = taskNameSchema.parse(request.body);
      const task = await this.tasks.updateName(request.authUser!.userId, id, input);
      response.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  setCompletion = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = taskIdSchema.parse(request.params);
      const input = taskCompletionSchema.parse(request.body);
      const task = await this.tasks.setCompletion(
        request.authUser!.userId,
        id,
        input
      );
      response.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  delete = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = taskIdSchema.parse(request.params);
      await this.tasks.delete(request.authUser!.userId, id);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
