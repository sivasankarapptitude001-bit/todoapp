import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RegistrationErrorResponse {
  error?: {
    message?: string;
  };
}

export function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await register(username, password);
      navigate("/login", { replace: true });
    } catch (error) {
      if (axios.isAxiosError<RegistrationErrorResponse>(error)) {
        setError(
          error.response?.data?.error?.message ??
            "Unable to reach the server. Check your connection and try again."
        );
      } else {
        setError("Could not register. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-app">
      <section className="auth-card">
        <h1>Create account</h1>
        <form className="auth-form" onSubmit={submitForm}>
          <label>
            Username
            <input
              value={username}
              minLength={3}
              maxLength={100}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              minLength={12}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={confirmation}
              minLength={12}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
        <p>Already have an account? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
