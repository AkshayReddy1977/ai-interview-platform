import { apiClient } from './apiClient';
import { tokenManager } from './tokenManager';
import { ApiEnvelope, AuthResponseData, AuthUser, LoginPayload, RegisterPayload } from '../types/auth.types';

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const { data } = await apiClient.post<ApiEnvelope<AuthResponseData>>('/auth/register', payload);
    tokenManager.set(data.data.accessToken);
    return data.data.user;
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    const { data } = await apiClient.post<ApiEnvelope<AuthResponseData>>('/auth/login', payload);
    tokenManager.set(data.data.accessToken);
    return data.data.user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      tokenManager.clear();
    }
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await apiClient.get<ApiEnvelope<{ user: AuthUser }>>('/auth/me');
    return data.data.user;
  },

  /** Attempts to silently restore a session on app load using the httpOnly refresh cookie. */
  async bootstrapSession(): Promise<AuthUser | null> {
    try {
      const { data } = await apiClient.post<ApiEnvelope<AuthResponseData>>('/auth/refresh');
      tokenManager.set(data.data.accessToken);
      return data.data.user;
    } catch {
      tokenManager.clear();
      return null;
    }
  },
};
