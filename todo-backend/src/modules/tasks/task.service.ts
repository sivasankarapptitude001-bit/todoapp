import { AppError } from "../../common/errors/AppError";
import { Task } from "./task.model";
import { TaskRepository } from "./task.repository";
import { TaskCompletionInput, TaskNameInput } from "./task.validation";

export class TaskService {
  constructor(private readonly tasks = new TaskRepository()) {}

  private serialize(task: Task) {
    return {
      id: task.id,
      name: task.name,
      completionDate: task.completionDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }

  private async requireOwnedTask(userId: string, taskId: string): Promise<Task> {
    const task = await this.tasks.findById(userId, taskId);
    if (!task) {
      throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
    }
    return task;
  }

  async create(userId: string, input: TaskNameInput) {
    const task = await this.tasks.create({ userId, name: input.name });
    return this.serialize(task);
  }

  async list(userId: string) {
    const tasks = await this.tasks.findAllByUser(userId);
    return tasks.map((task) => this.serialize(task));
  }

  async get(userId: string, taskId: string) {
    const task = await this.requireOwnedTask(userId, taskId);
    return this.serialize(task);
  }

  async updateName(userId: string, taskId: string, input: TaskNameInput) {
    const task = await this.requireOwnedTask(userId, taskId);
    return this.serialize(await this.tasks.updateName(task, input.name));
  }

  async setCompletion(
    userId: string,
    taskId: string,
    input: TaskCompletionInput
  ) {
    const task = await this.requireOwnedTask(userId, taskId);
    return this.serialize(await this.tasks.setCompletion(task, input.completed));
  }

  async delete(userId: string, taskId: string): Promise<void> {
    const task = await this.requireOwnedTask(userId, taskId);
    await this.tasks.delete(task);
  }
}
