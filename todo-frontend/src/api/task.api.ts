import { api } from "./axios";
import type { ApiResponse } from "../types/auth.types";
import type { Task } from "../types/task.types";

export async function listTasks(): Promise<Task[]> {
  const response = await api.get<ApiResponse<Task[]>>("/tasks");
  return response.data.data;
}

export async function createTask(name: string): Promise<Task> {
  const response = await api.post<ApiResponse<Task>>("/tasks", { name });
  return response.data.data;
}

export async function updateTaskName(id: string, name: string): Promise<Task> {
  const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, { name });
  return response.data.data;
}

export async function setTaskCompletion(id: string, completed: boolean): Promise<Task> {
  const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}/completion`, {
    completed
  });
  return response.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
