import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';
import { getApiBaseUrl } from '@/utils/env';
import { useAuthStore } from '@/stores/modules/auth';
import router from '@/router';

const baseURL = getApiBaseUrl();

export const http = axios.create({
  baseURL,
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.isLoggedIn) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.clearAuth();
      void router.push({ name: 'login' });
    }
    return Promise.reject(
      error instanceof Error ? error : new Error(String(error)),
    );
  },
);

export async function get<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.get<ApiResponse<T>>(url, config);
  return data.data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await http.post<ApiResponse<T>>(url, body);
  return data.data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await http.patch<ApiResponse<T>>(url, body);
  return data.data;
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await http.delete<ApiResponse<T>>(url);
  return data.data;
}
