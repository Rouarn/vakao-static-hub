import { post } from '../utils/request';
import type { LoginResponse } from '@/types/models';

export function login(username: string, password: string) {
  return post<LoginResponse>('/auth/login', { username, password });
}
