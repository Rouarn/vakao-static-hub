import { http } from '@/service/request/http';

/**
 * 认证相关 API
 */

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 */
export function login(username: string, password: string) {
  return http.post<ApiResponse<LoginResponse>>('/auth/login', {
    username,
    password,
  });
}
