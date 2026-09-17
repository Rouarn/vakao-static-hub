/**
 * 文件条目实体
 * 定义文件索引在数据库中的存储结构
 */

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 文件条目实体类
 * 用于存储文件的元数据索引信息
 * 支持多根目录、多分类的文件管理
 */
@Entity({ name: 'file_entries' })
@Index(['rootId', 'category', 'relPath'], { unique: true })
export class FileEntryEntity {
  /** 主键 ID，自增 */
  @PrimaryGeneratedColumn()
  id!: number;

  /** 资源根目录 ID，关联 ResourceRootsService 中的配置 */
  @Column({ type: 'varchar', length: 64 })
  rootId!: string;

  /** 分类名称，对应根目录下的一级子目录 */
  @Column({ type: 'varchar', length: 255 })
  category!: string;

  /** 相对于分类目录的相对路径 */
  @Column({ type: 'varchar', length: 1024 })
  relPath!: string;

  /** 文件名（包含扩展名） */
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  /** 文件扩展名（小写，包含点号） */
  @Column({ type: 'varchar', length: 32 })
  ext!: string;

  /** 文件大小（字节） */
  @Column({ type: 'integer' })
  size!: number;

  /** 文件最后修改时间（毫秒时间戳） */
  @Column({ type: 'integer' })
  mtimeMs!: number;
}
