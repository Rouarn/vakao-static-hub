import { del, get, patch, post } from '../utils/request';
import type { LoginResponse, RegisterParams, UserInfo } from '@vakao/shared';

export function login(username: string, password: string) {
  return post<LoginResponse>('/auth/login', {
    username,
    password,
  } satisfies RegisterParams);
}

export function register(username: string, password: string) {
  return post<LoginResponse>('/auth/register', {
    username,
    password,
  } satisfies RegisterParams);
}

export function getProfile() {
  return get<UserInfo>('/auth/profile');
}

/** 退出登录，吊销当前 Token */
export function logout() {
  return post<{ success: true }>('/auth/logout');
}

/** 修改当前用户密码 */
export function changePassword(oldPassword: string, newPassword: string) {
  return patch<{ success: true }>('/auth/password', {
    oldPassword,
    newPassword,
  });
}

/** 获取用户列表 */
export function listUsers() {
  return get<UserInfo[]>('/auth/users');
}

/** 删除用户 */
export function deleteUser(id: number) {
  return del<{ success: true }>(`/auth/users/${id}`);
}
