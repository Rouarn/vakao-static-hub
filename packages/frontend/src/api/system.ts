import { get } from '../utils/request';

/** 审计日志记录（与后端 AuditLogEntity 对应） */
export interface AuditLog {
  id: number;
  userId: number | null;
  username: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: number;
}

/** 审计日志分页查询结果 */
export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

/** 审计日志查询参数 */
export interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  action?: string;
  resourceType?: string;
  username?: string;
  startTime?: number;
  endTime?: number;
}

/** 内存占用（字节） */
export interface MemoryMetrics {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
}

/** QPS 滑动窗口指标 */
export interface QpsMetrics {
  windowSeconds: number;
  requests: number;
  perSecond: number;
}

/** 单个资源根的存储指标 */
export interface RootMetric {
  rootId: string;
  name: string;
  fileCount: number;
  totalSize: number;
}

/** 分享链接指标 */
export interface ShareMetrics {
  total: number;
  active: number;
  expired: number;
}

/** 应用版本指标（按状态分组） */
export interface AppMetrics {
  total: number;
  published: number;
  draft: number;
  gray: number;
  offline: number;
}

/** 系统运行指标（与后端 MetricsService 返回对应） */
export interface SystemMetrics {
  uptime: number;
  memory: MemoryMetrics;
  qps: QpsMetrics;
  storage: {
    totalSize: number;
    fileCount: number;
  };
  roots: RootMetric[];
  shares: ShareMetrics;
  apps: AppMetrics;
  /** 最近 24 小时各升级事件类型的数量，键为事件类型 */
  upgradeEvents24h: Record<string, number>;
  users: number;
}

/** 分页查询操作审计日志 */
export function getAuditLogs(params: AuditLogQuery) {
  return get<AuditLogPage>('/audit-logs', { params });
}

/** 获取系统运行指标 */
export function getSystemMetrics() {
  return get<SystemMetrics>('/metrics');
}
