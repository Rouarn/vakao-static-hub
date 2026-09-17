import { get, post, del } from '../utils/request';
import { http } from '../utils/request';
import type { ShareLink, CreateShareLinkParams } from '@vakao/shared';

export function createShareLink(params: CreateShareLinkParams) {
  return post<ShareLink>('/share', params);
}

export function getShareLinks() {
  return get<ShareLink[]>('/share/list');
}

export function revokeShareLink(token: string) {
  return del<{ success: true }>(`/share/${token}`);
}

export function getShareLinkUrl(token: string) {
  const base = (http.defaults.baseURL || window.location.origin).replace(
    /\/$/,
    '',
  );
  return `${base}/share/${token}`;
}
