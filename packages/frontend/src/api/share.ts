import { get, post, del } from '../utils/request';
import { http } from '../utils/request';
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

export function getShareLinkUrl(token: string) {
  const base = (http.defaults.baseURL || window.location.origin).replace(
    /\/$/,
    '',
  );
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

/** 生成带访问令牌的分享文件 URL（用于直接预览/下载） */
export function getShareFileUrl(token: string, accessToken?: string) {
  const base = getShareLinkUrl(token);
  return accessToken
    ? `${base}?accessToken=${encodeURIComponent(accessToken)}`
    : base;
}
