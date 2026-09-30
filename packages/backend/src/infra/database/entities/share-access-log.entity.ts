/**
 * 分享访问记录实体
 * 记录每次通过分享链接访问文件的行为，用于访问审计与统计
 */

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 分享访问记录实体类
 * 每次成功访问分享链接时异步写入一条记录，写入失败不影响访问本身
 */
@Entity({ name: 'share_access_logs' })
@Index(['shareToken'])
export class ShareAccessLogEntity {
  /** 主键 ID，自增 */
  @PrimaryGeneratedColumn()
  id!: number;

  /** 分享 token，关联 share_links.token */
  @Column({ type: 'varchar', length: 64 })
  shareToken!: string;

  /** 访问者 IP 地址，获取不到时为 null */
  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  /** 访问者 User-Agent，获取不到时为 null */
  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  /** 访问时间戳（毫秒） */
  @Column({ type: 'integer' })
  accessedAt!: number;
}
