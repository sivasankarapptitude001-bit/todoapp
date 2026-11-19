import { useAuth } from "../context/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { TaskForm } from "../components/tasks/TaskForm";
import { TaskList } from "../components/tasks/TaskList";

export function Dashboard() {
  const { user, logout } = useAuth();
  const { tasks, isLoading, error, create, updateName, setCompleted, remove } = useTasks();

  return (
    <main className="app dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Todo dashboard</p>
          <h1>{user?.username}&apos;s tasks</h1>
        </div>
        <button type="button" className="secondary-button" onClick={() => void logout()}>
          Sign out
        </button>
      </header>

      <TaskForm onCreate={create} />
      {isLoading && <p className="loading-state">Loading tasks...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!isLoading && (
        <TaskList
          tasks={tasks}
          onUpdateName={updateName}
          onSetCompleted={setCompleted}
          onDelete={remove}
        />
      )}
    </main>
  );
}
