/**
 * 前后端共享的 APP 在线更新类型。
 *
 * 对应后端 app-update 模块的版本查询、发布、回滚、漏斗统计等接口契约。
 */

/** 版本列表查询参数（对应后端 ListVersionsQueryDto） */
export interface ListVersionsQuery {
  page?: number;
  pageSize?: number;
  status?: number;
  appKey?: string;
}

/** 灰度递增步骤：发布后 hours 小时将灰度比例扩大到 percent */
export interface GrayIncrementStep {
  hours: number;
  percent: number;
}

/** 一键回滚返回结果 */
export interface RollbackResult {
  success: true;
  rolledBack: { id: number; versionCode: number };
  restored: { id: number; versionCode: number; versionName: string };
}

/** 单个版本的升级漏斗统计项 */
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

/** 升级漏斗统计返回结果（GET /app-updates/stats/funnel） */
export interface FunnelStatsResult {
  appKey: string;
  items: FunnelStatItem[];
  checkNoUpdateTotal: number;
}
