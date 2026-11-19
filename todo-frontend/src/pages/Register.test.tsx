// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Register } from "./Register";

const { register } = vi.hoisted(() => ({
  register: vi.fn()
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null, register })
}));

function submitRegistration() {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: "new-user" }
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "LongSecurePassword123" }
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "LongSecurePassword123" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
}

describe("Register", () => {
  afterEach(cleanup);

  beforeEach(() => {
    register.mockReset();
  });

  it("shows the backend error instead of assuming the username exists", async () => {
    register.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: { message: "Username already exists" } } }
    });

    submitRegistration();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Username already exists"
    );
  });

  it("shows a connection hint when the API cannot be reached", async () => {
    register.mockRejectedValue({
      isAxiosError: true,
      message: "Network Error"
    });

    submitRegistration();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Unable to reach the server"
    );
  });
});
