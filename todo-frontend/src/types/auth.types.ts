export interface AuthUser {
  id: string;
  username: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
