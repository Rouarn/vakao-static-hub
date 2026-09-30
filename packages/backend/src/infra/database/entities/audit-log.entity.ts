/**
 * 操作审计日志实体
 * 记录管理端关键操作（文件、分享、用户、APP 版本等）的操作轨迹
 */

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  /** 主键 ID，自增 */
  @PrimaryGeneratedColumn()
  id!: number;

  /** 操作用户 ID（未登录场景如登录失败时可为空） */
  @Index()
  @Column({ type: 'integer', nullable: true })
  userId!: number | null;

  /** 操作用户名 */
  @Index()
  @Column({ type: 'varchar', length: 64 })
  username!: string;

  /** 操作动作，如 file.upload / file.delete / share.create 等 */
  @Index()
  @Column({ type: 'varchar', length: 64 })
  action!: string;

  /** 资源类型，如 file / share / app_version / user 等 */
  @Index()
  @Column({ type: 'varchar', length: 32 })
  resourceType!: string;

  /** 资源标识（如分享 token、版本 ID 等），可为空 */
  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceId!: string | null;

  /** 操作详情（JSON 字符串），可为空 */
  @Column({ type: 'text', nullable: true })
  details!: string | null;

  /** 客户端 IP（兼容反向代理取 x-forwarded-for） */
  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  /** 客户端 User-Agent */
  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null;

  /** 操作时间戳（毫秒） */
  @Index()
  @Column({ type: 'integer' })
  createdAt!: number;
}
