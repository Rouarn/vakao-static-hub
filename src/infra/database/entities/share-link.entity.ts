/**
 * 文件分享链接实体
 * 存储分享链接的元数据，支持过期时间和访问次数限制
 */

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 文件分享链接实体类
 * 用于存储分享链接信息，包括 token、文件路径、过期时间、访问限制等
 */
@Entity({ name: 'share_links' })
@Index(['token'], { unique: true })
export class ShareLinkEntity {
  /** 主键 ID，自增 */
  @PrimaryGeneratedColumn()
  id!: number;

  /** 分享 token，唯一标识，用于公开访问链接 */
  @Column({ type: 'varchar', length: 64 })
  token!: string;

  /** 资源根目录 ID */
  @Column({ type: 'varchar', length: 64 })
  rootId!: string;

  /** 分类目录名 */
  @Column({ type: 'varchar', length: 255 })
  category!: string;

  /** 文件相对路径 */
  @Column({ type: 'varchar', length: 1024 })
  filePath!: string;

  /** 过期时间戳（毫秒），null 表示永不过期 */
  @Column({ type: 'integer', nullable: true })
  expiresAt!: number | null;

  /** 最大访问次数，null 表示不限制 */
  @Column({ type: 'integer', nullable: true })
  maxAccesses!: number | null;

  /** 当前已访问次数 */
  @Column({ type: 'integer', default: 0 })
  accessCount!: number;

  /** 创建时间戳（毫秒） */
  @Column({ type: 'integer' })
  createdAt!: number;
}
