import { get, post, del } from '../utils/request';
import { getApiBaseUrl, getBaseUrl } from '@/utils/env';
import type {
  ShareLink,
  CreateShareLinkParams,
  ShareAccessLog,
  ShareInfo,
} from '@vakao/shared';

export function createShareLink(params: CreateShareLinkParams) {
  return post<ShareLink>('/share', params);
}

export function getShareLinks() {
  return get<ShareLink[]>('/share/list');
}

export function revokeShareLink(token: string) {
  return del<{ success: true }>(`/share/${token}`);
}

/** 获取指定分享链接的访问记录列表 */
export function getShareAccessLogs(token: string) {
  return get<ShareAccessLog[]>(`/share/${token}/access-logs`);
}

/**
 * 获取分享链接的完整 URL（前端公开访问页，用于复制分享）
 * 开发环境 VITE_API_BASE_URL 留空时回退到当前页面 origin
 */
export function getShareLinkUrl(token: string) {
  const base = (getBaseUrl() || window.location.origin).replace(/\/$/, '');
  return `${base}/share/${token}`;
}

/** 获取分享链接的公开信息 */
export function getShareInfo(token: string) {
  return get<ShareInfo>(`/share/${token}/info`);
}

/** 校验分享访问密码，验证通过返回临时访问令牌 */
export function verifySharePassword(token: string, password: string) {
  return post<{ success: boolean; accessToken: string }>(
    `/share/${token}/verify`,
    { password },
  );
}

/**
 * 生成后端分享文件下载 API URL（用于实际预览/下载）
 * 走 /static API 前缀（开发环境由 Vite proxy 转发到后端）
 */
export function getShareFileUrl(token: string, accessToken?: string) {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const url = `${base}/share/${token}`;
  return accessToken
    ? `${url}?accessToken=${encodeURIComponent(accessToken)}`
    : url;
}
