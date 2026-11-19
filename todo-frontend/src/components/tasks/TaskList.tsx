import type { Task } from "../../types/task.types";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  onUpdateName: (id: string, name: string) => Promise<void>;
  onSetCompleted: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TaskList(props: TaskListProps) {
  if (!props.tasks.length) {
    return <p className="empty-state">No tasks yet. Add one above.</p>;
  }

  return (
    <ul className="task-list">
      {props.tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onUpdateName={props.onUpdateName}
          onSetCompleted={props.onSetCompleted}
          onDelete={props.onDelete}
        />
      ))}
    </ul>
  );
}
