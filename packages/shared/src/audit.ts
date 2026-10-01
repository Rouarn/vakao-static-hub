/**
 * 前后端共享的审计日志类型。
 *
 * 后端 AuditLogEntity 与前端审计日志页共用这些类型，避免字段漂移。
 */

/** 审计日志记录（对应后端 audit_logs 表行） */
export interface AuditLog {
  id: number;
  userId: number | null;
  username: string;
  /** 操作动作，如 file.upload / share.create / app_version.publish */
  action: string;
  /** 资源类型，如 file / share / app_version / user */
  resourceType: string;
  resourceId: string | null;
  /** 操作详情（JSON 字符串），详情弹窗中会反序列化展示 */
  details: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: number;
}

/** 审计日志查询参数（前后端共用，对应后端 QueryAuditLogDto） */
export interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  action?: string;
  resourceType?: string;
  username?: string;
  startTime?: number;
  endTime?: number;
}

/** 审计日志分页结果 = PagedResult<AuditLog> 的别名，便于前端直接使用 */
export type AuditLogPage = import('./api.js').PagedResult<AuditLog>;
