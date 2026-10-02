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

/** 文件管理相关的服务端下发配置 */
export interface FileConfig {
  /** 默认兜底分类名（后端 DEFAULT_CATEGORY 环境变量），该分类不允许重命名 */
  defaultCategory: string;
}

export interface ShareLink {
  id: number;
  token: string;
  rootId: string;
  category: string;
  filePath: string;
  /** 分享类型：file 单文件 / collection 多文件 */
  shareType: 'file' | 'collection';
  /** 多文件相对路径列表，仅 shareType='collection' 时存在 */
  filePaths: string[] | null;
  expiresAt: number | null;
  /** 最大打开次数，null 表示不限制；打开后下载文件不再计数 */
  maxAccesses: number | null;
  /** 已成功打开（解锁）次数 */
  accessCount: number;
  createdAt: number;
  /** 是否设置了访问密码（不会返回密码哈希本身） */
  hasPassword?: boolean;
}

/** 分享链接的公开信息（用于访问前判断是否需要密码） */
export interface ShareInfo {
  token: string;
  rootId: string;
  category: string;
  filePath: string;
  shareType: 'file' | 'collection';
  filePaths: string[] | null;
  expiresAt: number | null;
  maxAccesses: number | null;
  hasPassword: boolean;
}

export interface CreateShareLinkParams {
  rootId: string;
  category: string;
  filePath: string;
  /** 分享类型，默认 file */
  shareType?: 'file' | 'collection';
  /** 多文件相对路径列表，shareType='collection' 时必填 */
  filePaths?: string[];
  expiresInMs?: number;
  /** 最大打开次数；链接每被成功解锁一次计 1 次，打开后下载文件不计数 */
  maxAccesses?: number;
  /** 访问密码，可选，传入后访问分享需要密码验证 */
  password?: string;
}

/** 分享访问记录 */
export interface ShareAccessLog {
  id: number;
  shareToken: string;
  ip: string | null;
  userAgent: string | null;
  accessedAt: number;
}

/** 登录用户基础信息（不含密码等敏感字段） */
export interface UserInfo {
  id: number;
  username: string;
  createdAt: number;
}

/** 注册请求参数 */
export interface RegisterParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: UserInfo;
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
  /** 灰度自动递增开关 0/1 */
  grayAutoIncrement: number;
  /** 灰度递增时间表 JSON：[{ "hours": 24, "percent": 30 }, ...] */
  grayIncrementSchedule: string | null;
  /** 定时发布时间戳（毫秒），仅草稿生效 */
  scheduledPublishAt: number | null;
  /** 定时发布模式：full 全量 / gray 灰度 */
  scheduledPublishMode: string;
  /** 定时灰度发布的灰度百分比 */
  scheduledGrayPercent: number;
  status: AppVersionStatus;
  publishTime: number | null;
  remark: string | null;
  createdAt: number;
  updatedAt: number;
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
