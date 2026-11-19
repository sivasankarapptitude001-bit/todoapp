import { Task } from "./task.model";

export interface CreateTaskInput {
  userId: string;
  name: string;
}

export class TaskRepository {
  async create(input: CreateTaskInput): Promise<Task> {
    return Task.create({
      userId: input.userId,
      name: input.name
    });
  }

  async findAllByUser(userId: string): Promise<Task[]> {
    return Task.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]]
    });
  }

  async findById(userId: string, taskId: string): Promise<Task | null> {
    return Task.findOne({ where: { id: taskId, userId } });
  }

  async updateName(task: Task, name: string): Promise<Task> {
    task.name = name;
    await task.save();
    return task;
  }

  async setCompletion(task: Task, completed: boolean): Promise<Task> {
    task.completionDate = completed ? new Date() : null;
    await task.save();
    return task;
  }

  async delete(task: Task): Promise<void> {
    await task.destroy();
  }
}
