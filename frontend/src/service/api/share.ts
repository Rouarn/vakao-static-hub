import { http } from '@/service/request/http';
import type { ApiResponse } from './auth';

/**
 * 分享链接相关 API
 */

export interface ShareLink {
  id: number;
  token: string;
  rootId: string;
  category: string;
  filePath: string;
  expiresAt: number | null;
  maxAccesses: number | null;
  accessCount: number;
  createdAt: number;
}

export interface CreateShareLinkParams {
  rootId: string;
  category: string;
  filePath: string;
  expiresInMs?: number;
  maxAccesses?: number;
}

/**
 * 创建分享链接
 */
export function createShareLink(params: CreateShareLinkParams) {
  return http.post<ApiResponse<ShareLink>>('/share', params);
}

/**
 * 获取分享链接列表
 */
export function getShareLinks() {
  return http.get<ApiResponse<ShareLink[]>>('/share/list');
}

/**
 * 撤销分享链接
 */
export function revokeShareLink(token: string) {
  return http.delete<ApiResponse<{ success: true }>>(`/share/${token}`);
}

/**
 * 获取分享链接的公开访问 URL
 */
export function getShareLinkUrl(token: string) {
  const base = (http.defaults.baseURL || window.location.origin).replace(
    /\/$/,
    '',
  );
  return `${base}/share/${token}`;
}
