import { useCallback, useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  listTasks,
  setTaskCompletion,
  updateTaskName
} from "../api/task.api";
import type { Task } from "../types/task.types";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setTasks(await listTasks());
    } catch {
      setError("Could not load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(async (name: string) => {
    const task = await createTask(name);
    setTasks((current) => [task, ...current]);
  }, []);

  const updateName = useCallback(async (id: string, name: string) => {
    const updated = await updateTaskName(id, name);
    setTasks((current) => current.map((task) => task.id === id ? updated : task));
  }, []);

  const setCompleted = useCallback(async (id: string, completed: boolean) => {
    const updated = await setTaskCompletion(id, completed);
    setTasks((current) => current.map((task) => task.id === id ? updated : task));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteTask(id);
    setTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  return { tasks, isLoading, error, reload: load, create, updateName, setCompleted, remove };
}
