import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * Axios instance with automatic token refresh.
 * - Access token lives in memory only (never localStorage — XSS-safe).
 * - The refresh token is an httpOnly cookie managed by the server.
 * - On a 401, one refresh attempt is made and the original request replayed;
 *   concurrent 401s share the same refresh promise.
 */
export const api = axios.create({ baseURL: '/api/v1', withCredentials: true });

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  refreshPromise ??= axios
    .post<{ data: { accessToken: string } }>('/api/v1/auth/refresh', null, { withCredentials: true })
    .then((res) => {
      const token = res.data.data.accessToken;
      setAccessToken(token);
      return token;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
  const isAuthRoute = original?.url?.startsWith('/auth/');
  if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
    original._retried = true;
    try {
      const token = await refreshAccessToken();
      original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
      return api.request(original);
    } catch {
      setAccessToken(null);
      onSessionExpired?.();
    }
  }
  return Promise.reject(error);
});

/** Extract the server's error message from any failed request. */
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}
