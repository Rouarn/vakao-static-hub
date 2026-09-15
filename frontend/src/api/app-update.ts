import { get, post, patch, del, http } from '../utils/request';
import type { ApiResponse, PagedResult } from '@/types/api';
import type { AppVersion } from '@/types/models';
import type { AxiosProgressEvent } from 'axios';

export interface ListVersionsParams {
  page?: number;
  pageSize?: number;
  status?: number;
  appKey?: string;
}

/** 获取全部应用标识（apk 根下的分类目录） */
export function getApps() {
  return get<string[]>('/app-updates/apps');
}

/** 新建应用（创建应用目录） */
export function createApp(appKey: string) {
  return post<{ appKey: string }>('/app-updates/apps', { appKey });
}

export function getVersions(params: ListVersionsParams) {
  return get<PagedResult<AppVersion>>('/app-updates/versions', { params });
}

export function getVersion(id: number) {
  return get<AppVersion>(`/app-updates/versions/${id}`);
}

/**
 * 上传 APK 创建草稿版本
 * 大文件必须单独传 timeout: 0 覆盖全局 10s 超时，并携带上传进度回调
 */
export function createVersion(
  payload: {
    file: File;
    appKey: string;
    versionName: string;
    versionCode: number;
    updateLog?: string;
    remark?: string;
  },
  onUploadProgress?: (e: AxiosProgressEvent) => void,
) {
  const fd = new FormData();
  fd.append('file', payload.file);
  fd.append('appKey', payload.appKey);
  fd.append('versionName', payload.versionName);
  fd.append('versionCode', String(payload.versionCode));
  if (payload.updateLog) fd.append('updateLog', payload.updateLog);
  if (payload.remark) fd.append('remark', payload.remark);
  return http
    .post<ApiResponse<AppVersion>>('/app-updates/versions', fd, {
      timeout: 0,
      onUploadProgress,
    })
    .then((r) => r.data.data);
}

export function updateVersion(
  id: number,
  payload: { versionName?: string; updateLog?: string; remark?: string },
) {
  return patch<AppVersion>(`/app-updates/versions/${id}`, payload);
}

export function publishVersion(
  id: number,
  payload: { mode: 'full' | 'gray'; grayPercent?: number },
) {
  return post<AppVersion>(`/app-updates/versions/${id}/publish`, payload);
}

/** 远程强更开关（逃生口）：PUT 语义，经 http 直发 */
export function setForceUpdate(
  id: number,
  payload: { forceUpdate: boolean; minVersionCode?: number },
) {
  return http
    .put<ApiResponse<AppVersion>>(`/app-updates/versions/${id}/force`, payload)
    .then((r) => r.data.data);
}

export function offlineVersion(id: number) {
  return post<AppVersion>(`/app-updates/versions/${id}/offline`);
}

export function removeVersion(id: number) {
  return del<{ success: true }>(`/app-updates/versions/${id}`);
}
