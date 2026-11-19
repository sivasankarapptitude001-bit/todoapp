import { useState, type FormEvent } from "react";
import type { Task } from "../../types/task.types";

interface TaskItemProps {
  task: Task;
  onUpdateName: (id: string, name: string) => Promise<void>;
  onSetCompleted: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskItem({
  task,
  onUpdateName,
  onSetCompleted,
  onDelete
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [error, setError] = useState("");

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Task name is required.");
      return;
    }
    setError("");
    try {
      await onUpdateName(task.id, name.trim());
      setIsEditing(false);
    } catch {
      setError("Could not update task.");
    }
  };

  const toggleCompletion = async () => {
    try {
      await onSetCompleted(task.id, !task.completionDate);
    } catch {
      setError("Could not update task.");
    }
  };

  const remove = async () => {
    try {
      await onDelete(task.id);
    } catch {
      setError("Could not delete task.");
    }
  };

  return (
    <li className={`task-item ${task.completionDate ? "completed" : ""}`}>
      <input
        type="checkbox"
        checked={Boolean(task.completionDate)}
        onChange={toggleCompletion}
        aria-label={task.completionDate ? "Reopen task" : "Complete task"}
      />
      {isEditing ? (
        <form className="edit-task-form" onSubmit={saveName}>
          <input
            aria-label="Edit task name"
            value={name}
            maxLength={255}
            onChange={(event) => setName(event.target.value)}
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <span className="task-name">{task.name}</span>
      )}
      {!isEditing && (
        <div className="task-actions">
          <button type="button" onClick={() => setIsEditing(true)}>Edit</button>
          <button type="button" onClick={remove}>Delete</button>
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </li>
  );
}
