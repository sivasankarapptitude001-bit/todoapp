import { useState, type FormEvent } from "react";

interface TaskFormProps {
  onCreate: (name: string) => Promise<void>;
}

export function TaskForm({ onCreate }: TaskFormProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Task name is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onCreate(trimmedName);
      setName("");
    } catch {
      setError("Could not create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="task-form" onSubmit={submit}>
      <input
        aria-label="Task name"
        value={name}
        maxLength={255}
        onChange={(event) => setName(event.target.value)}
        placeholder="What needs to be done?"
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add task"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
