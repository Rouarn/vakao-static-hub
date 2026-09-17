/**
 * 前后端共享的业务模型类型。
 *
 * 这些类型同时被 backend 的 controller/service 与 frontend 的 api/store 使用，
 * 通过 @vakao/shared 统一导出，避免前后端各自维护造成类型漂移。
 */
export interface ResourceRoot {
  id: string;
  name: string;
  path: string;
}

export interface FileItem {
  name: string;
  path: string;
  size: number;
  mtime: number;
}

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

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

export type ViewMode = 'grid' | 'list';
export type SortField = 'name' | 'size' | 'mtime';
export type SortOrder = 'asc' | 'desc';

/** APP 版本状态：0 草稿 / 1 灰度 / 2 全量 / 3 已下架 */
export type AppVersionStatus = 0 | 1 | 2 | 3;

export interface AppVersion {
  id: number;
  platform: string;
  /** 应用标识（software-update 根下的分类目录名，如 xiaolv / xiaolan） */
  appKey: string;
  versionName: string;
  versionCode: number;
  updateType: string;
  packageSize: number;
  checksum: string;
  storageRootId: string;
  category: string;
  relPath: string;
  updateLog: string | null;
  forceUpdate: number;
  minVersionCode: number;
  grayPercent: number;
  status: AppVersionStatus;
  publishTime: number | null;
  remark: string | null;
  createdAt: number;
  updatedAt: number;
  isDeleted: number;
}

export type UpgradeEventName =
  | 'check_no_update'
  | 'prompt_show'
  | 'download_start'
  | 'download_success'
  | 'download_fail'
  | 'verify_fail'
  | 'install_success'
  | 'install_fail'
  | 'new_version_launch';

export interface AppUpgradeEvent {
  id: number;
  deviceId: string;
  appKey: string;
  fromVersionCode: number | null;
  toVersionCode: number | null;
  event: UpgradeEventName;
  failCode: string | null;
  networkType: string | null;
  osVersion: string | null;
  deviceModel: string | null;
  costMs: number | null;
  createdAt: number;
}
