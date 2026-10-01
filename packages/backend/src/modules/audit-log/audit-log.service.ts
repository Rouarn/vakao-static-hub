/**
 * 审计日志服务
 * 提供异步写入（不阻塞主流程）与分页查询能力
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '#/infra/database/entities/audit-log.entity.js';
import { QueryAuditLogDto } from './dto/query-audit-log.dto.js';

/** 审计日志写入参数 */
export interface AuditLogData {
  /** 操作用户 ID（可为空） */
  userId?: number | null;
  /** 操作用户名 */
  username: string;
  /** 操作动作，如 file.upload / share.create / app_version.publish */
  action: string;
  /** 资源类型，如 file / share / app_version / user */
  resourceType: string;
  /** 资源标识（可为空） */
  resourceId?: string | null;
  /** 操作详情，将序列化为 JSON 字符串存储（可为空） */
  details?: unknown;
  /** 客户端 IP（可为空） */
  ip?: string | null;
  /** 客户端 User-Agent（可为空） */
  userAgent?: string | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  /**
   * 异步写入审计日志（fire-and-forget）
   * 不阻塞主流程，写入失败仅记录 warn，不影响业务请求
   */
  log(data: AuditLogData): void {
    const entity = this.repo.create({
      userId: data.userId ?? null,
      username: data.username,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId ?? null,
      details: data.details !== undefined ? JSON.stringify(data.details) : null,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
      createdAt: Date.now(),
    });
    this.repo.save(entity).catch((e: unknown) => {
      this.logger.warn(`审计日志写入失败: ${(e as Error).message}`);
    });
  }

  /** 分页查询审计日志（按时间倒序，支持动作/资源类型/用户名/时间范围筛选） */
  async findAll(query: QueryAuditLogDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const qb = this.repo.createQueryBuilder('a');

    if (query.action) {
      qb.andWhere('a.action = :action', { action: query.action });
    }
    if (query.resourceType) {
      qb.andWhere('a.resourceType = :resourceType', {
        resourceType: query.resourceType,
      });
    }
    if (query.username) {
      qb.andWhere('a.username = :username', { username: query.username });
    }
    if (query.startTime !== undefined) {
      qb.andWhere('a.createdAt >= :startTime', { startTime: query.startTime });
    }
    if (query.endTime !== undefined) {
      qb.andWhere('a.createdAt <= :endTime', { endTime: query.endTime });
    }

    qb.orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }
}
