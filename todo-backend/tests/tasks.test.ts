import request from "supertest";
import { app } from "../src/app";
import { signAccessToken } from "../src/config/jwt";
import { Task } from "../src/modules/tasks/task.model";
import { TaskRepository } from "../src/modules/tasks/task.repository";
import { TaskService } from "../src/modules/tasks/task.service";

const taskId = "550e8400-e29b-41d4-a716-446655440000";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: taskId,
    userId: "user-1",
    name: "Complete architecture",
    completionDate: null,
    createdAt: new Date("2026-11-19T12:00:00.000Z"),
    updatedAt: new Date("2026-11-19T12:00:00.000Z"),
    ...overrides
  } as Task;
}

describe("TaskService", () => {
  it("creates a task for the authenticated user", async () => {
    const create = jest.fn().mockResolvedValue(makeTask());
    const service = new TaskService({ create } as unknown as TaskRepository);

    const result = await service.create("user-1", { name: "Complete architecture" });

    expect(create).toHaveBeenCalledWith({
      userId: "user-1",
      name: "Complete architecture"
    });
    expect(result.id).toBe(taskId);
  });

  it("lists only tasks returned for the authenticated user", async () => {
    const findAllByUser = jest.fn().mockResolvedValue([makeTask()]);
    const service = new TaskService({
      findAllByUser
    } as unknown as TaskRepository);

    const result = await service.list("user-1");

    expect(findAllByUser).toHaveBeenCalledWith("user-1");
    expect(result).toHaveLength(1);
  });

  it("rejects a task that is not owned by the authenticated user", async () => {
    const findById = jest.fn().mockResolvedValue(null);
    const service = new TaskService({ findById } as unknown as TaskRepository);

    await expect(service.get("user-2", taskId)).rejects.toMatchObject({
      statusCode: 404,
      code: "TASK_NOT_FOUND"
    });
  });

  it("updates a task name", async () => {
    const task = makeTask();
    const findById = jest.fn().mockResolvedValue(task);
    const updateName = jest.fn().mockImplementation(async (_task: Task, name: string) => {
      task.name = name;
      return task;
    });
    const service = new TaskService({
      findById,
      updateName
    } as unknown as TaskRepository);

    const result = await service.updateName("user-1", taskId, {
      name: "Updated architecture"
    });

    expect(updateName).toHaveBeenCalledWith(task, "Updated architecture");
    expect(result.name).toBe("Updated architecture");
  });

  it("completes and reopens a task", async () => {
    const task = makeTask();
    const findById = jest.fn().mockResolvedValue(task);
    const setCompletion = jest.fn().mockImplementation(
      async (_task: Task, completed: boolean) => {
        task.completionDate = completed ? new Date("2026-11-19T13:00:00.000Z") : null;
        return task;
      }
    );
    const service = new TaskService({
      findById,
      setCompletion
    } as unknown as TaskRepository);

    const completed = await service.setCompletion("user-1", taskId, { completed: true });
    const reopened = await service.setCompletion("user-1", taskId, { completed: false });

    expect(completed.completionDate).toEqual(new Date("2026-11-19T13:00:00.000Z"));
    expect(reopened.completionDate).toBeNull();
  });

  it("deletes only an owned task", async () => {
    const task = makeTask();
    const findById = jest.fn().mockResolvedValue(task);
    const deleteTask = jest.fn().mockResolvedValue(undefined);
    const service = new TaskService({
      findById,
      delete: deleteTask
    } as unknown as TaskRepository);

    await service.delete("user-1", taskId);

    expect(deleteTask).toHaveBeenCalledWith(task);
  });
});

describe("Task API", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects unauthenticated task requests", async () => {
    const response = await request(app).get("/api/v1/tasks");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects invalid task IDs", async () => {
    const token = signAccessToken("user-1", "siva");
    const response = await request(app)
      .get("/api/v1/tasks/not-a-uuid")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns cross-user task access as not found", async () => {
    jest.spyOn(TaskRepository.prototype, "findById").mockResolvedValue(null);
    const token = signAccessToken("user-2", "other");

    const response = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("TASK_NOT_FOUND");
  });
});
