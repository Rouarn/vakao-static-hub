import { get, post, patch, del, http } from '../utils/request';
import type { ApiResponse, PagedResult, AppVersion } from '@vakao/shared';
import type { AxiosProgressEvent } from 'axios';

export interface ListVersionsParams {
  page?: number;
  pageSize?: number;
  status?: number;
  appKey?: string;
}

/** 获取全部应用标识（software-update 根下的分类目录） */
export function getApps() {
  return get<string[]>('/app-updates/apps');
}

/** 新建应用（创建应用目录） */
export function createApp(appKey: string) {
  return post<{ appKey: string }>('/app-updates/apps', { appKey });
}

/** 修改应用标识（重命名目录，迁移全部版本/事件/索引记录） */
export function renameApp(appKey: string, newAppKey: string) {
  return patch<{ appKey: string }>(
    `/app-updates/apps/${encodeURIComponent(appKey)}`,
    { newAppKey },
  );
}

/** 删除应用（删除整个目录及全部关联数据库记录，不可恢复） */
export function deleteApp(appKey: string) {
  return del<{
    success: true;
    versionCount: number;
    eventCount: number;
    fileCount: number;
  }>(`/app-updates/apps/${encodeURIComponent(appKey)}`);
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
    scheduledPublishAt?: number;
    scheduledPublishMode?: 'full' | 'gray';
    scheduledGrayPercent?: number;
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
  if (payload.scheduledPublishAt !== undefined) {
    fd.append('scheduledPublishAt', String(payload.scheduledPublishAt));
  }
  if (payload.scheduledPublishMode) {
    fd.append('scheduledPublishMode', payload.scheduledPublishMode);
  }
  if (payload.scheduledGrayPercent !== undefined) {
    fd.append('scheduledGrayPercent', String(payload.scheduledGrayPercent));
  }
  return http
    .post<ApiResponse<AppVersion>>('/app-updates/versions', fd, {
      timeout: 0,
      onUploadProgress,
    })
    .then((r) => r.data.data);
}

export function updateVersion(
  id: number,
  payload: {
    versionName?: string;
    updateLog?: string;
    remark?: string;
    scheduledPublishAt?: number | null;
    scheduledPublishMode?: 'full' | 'gray';
    scheduledGrayPercent?: number;
  },
) {
  return patch<AppVersion>(`/app-updates/versions/${id}`, payload);
}

export interface GrayIncrementStep {
  hours: number;
  percent: number;
}

export function publishVersion(
  id: number,
  payload: {
    mode: 'full' | 'gray';
    grayPercent?: number;
    grayAutoIncrement?: boolean;
    grayIncrementSchedule?: GrayIncrementStep[];
  },
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

export interface RollbackResult {
  success: true;
  rolledBack: { id: number; versionCode: number };
  restored: { id: number; versionCode: number; versionName: string };
}

export function rollbackVersion(id: number) {
  return post<RollbackResult>(`/app-updates/versions/${id}/rollback`);
}

export function removeVersion(id: number) {
  return del<{ success: true }>(`/app-updates/versions/${id}`);
}

export interface FunnelStatItem {
  toVersionCode: number;
  versionName: string;
  checkNoUpdate: number;
  promptShow: number;
  downloadStart: number;
  downloadSuccess: number;
  downloadFail: number;
  verifyFail: number;
  installSuccess: number;
  installFail: number;
  newVersionLaunch: number;
  downloadRate: string;
  installRate: string;
  overallRate: string;
}

export interface FunnelStatsResult {
  appKey: string;
  items: FunnelStatItem[];
  checkNoUpdateTotal: number;
}

/** 升级漏斗统计（按版本聚合各事件转化率） */
export function getFunnelStats(params: {
  appKey: string;
  startTime?: number;
  endTime?: number;
}) {
  return get<FunnelStatsResult>('/app-updates/versions/stats/funnel', {
    params,
  });
}
