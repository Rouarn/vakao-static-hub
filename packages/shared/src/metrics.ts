/**
 * 前后端共享的系统监控指标类型。
 *
 * 对应后端 MetricsService.getMetrics() 的返回结构。
 */

/** 进程内存占用（字节），来自 process.memoryUsage() */
export interface MemoryMetrics {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
}

/** QPS 滑动窗口指标（最近 N 秒内的请求统计） */
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

/** 应用版本指标（按状态分组计数） */
export interface AppMetrics {
  total: number;
  published: number;
  draft: number;
  gray: number;
  offline: number;
}

/** 系统运行指标（GET /metrics 返回值） */
export interface SystemMetrics {
  /** 进程运行秒数 */
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
