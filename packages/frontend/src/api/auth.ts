import { get, post } from '../utils/request';
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
