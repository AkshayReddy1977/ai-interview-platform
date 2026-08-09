export type Role = 'USER' | 'ADMIN';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponseData {
  user: AuthUser;
  accessToken: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: unknown;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
