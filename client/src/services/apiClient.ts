import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenManager } from './tokenManager';

/**
 * Central Axios instance. All feature services (authService, resumeService,
 * interviewService, etc.) import this instead of creating their own client,
 * so auth token attachment / refresh / error handling stays in one place.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // sends the httpOnly refresh-token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenManager.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Prevents a stampede of parallel refresh calls if several requests 401
// at the same moment — they all await the same in-flight refresh promise.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const token = res.data.data.accessToken as string;
        tokenManager.set(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        tokenManager.clear();
        // Let the caller/UI handle redirect-to-login; we don't force navigation
        // here since this module has no router context.
      }
    }

    return Promise.reject(error);
  }
);
