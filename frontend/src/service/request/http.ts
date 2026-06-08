import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/modules/auth';
import { getApiBaseUrl } from '@/utils/env';
import router from '@/router';

/**
 * HTTP 请求模块
 * 封装 Axios 实例，统一配置和拦截器
 */

const baseURL = getApiBaseUrl();

export const http = axios.create({
  baseURL,
  timeout: 10000,
});

/**
 * 请求拦截器
 * 自动为已登录用户的请求添加 Authorization 头
 */
http.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.isLoggedIn) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }
  return config;
});

/**
 * 响应拦截器
 * 全局处理 HTTP 错误，如 401 未授权自动跳转登录
 */
http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      // 清除本地认证状态
      authStore.clearAuth();
      // 跳转到登录页
      void router.push({ name: 'login' });
    }
    return Promise.reject(
      error instanceof Error ? error : new Error(String(error)),
    );
  },
);
