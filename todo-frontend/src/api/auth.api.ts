import { api } from "./axios";
import type { ApiResponse, AuthUser } from "../types/auth.types";

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export async function register(username: string, password: string): Promise<AuthUser> {
  const response = await api.post<ApiResponse<AuthUser>>("/auth/register", {
    username,
    password
  });
  return response.data.data;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const response = await api.post<ApiResponse<LoginResult>>("/auth/login", {
    username,
    password
  });
  return response.data.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get<ApiResponse<AuthUser>>("/auth/me");
  return response.data.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
