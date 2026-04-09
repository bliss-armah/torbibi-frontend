import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Central API client — all feature modules import from here, not from axios directly.
 * This is the single place to add auth headers, error normalization, and retries.
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4030/api/v1',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach JWT to every request if available
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Normalize API errors so callers get a consistent shape
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error: { code: string; message: string; details?: Record<string, string[]> } }>) => {
      if (error.response?.data?.error) {
        // Return a structured error that features can handle
        return Promise.reject(error.response.data.error);
      }
      return Promise.reject({ code: 'NETWORK_ERROR', message: 'Network request failed' });
    }
  );

  return client;
}

export const apiClient = createApiClient();
