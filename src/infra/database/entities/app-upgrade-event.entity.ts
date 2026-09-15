/**
 * APP 升级事件实体
 * 记录各应用客户端升级漏斗各环节事件，用于转化率统计与失败告警
 */

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 升级事件实体类
 * 客户端通过 report 接口单条轻量写入，接口失败客户端无感
 */
@Entity({ name: 'app_upgrade_events' })
@Index(['event'])
@Index(['deviceId'])
export class AppUpgradeEventEntity {
  /** 主键 ID，自增 */
  @PrimaryGeneratedColumn()
  id!: number;

  /** 设备唯一标识（灰度分桶与漏斗统计用） */
  @Column({ type: 'varchar', length: 128 })
  deviceId!: string;

  /** 应用标识（对应 software-update 根下的分类目录名） */
  @Column({ type: 'varchar', length: 64, default: 'default' })
  appKey!: string;

  /** 客户端升级前版本号 */
  @Column({ type: 'integer', nullable: true })
  fromVersionCode!: number | null;

  /** 目标版本号 */
  @Column({ type: 'integer', nullable: true })
  toVersionCode!: number | null;

  /** 事件：check_no_update/prompt_show/download_start/download_success/download_fail/verify_fail/install_success/install_fail/new_version_launch */
  @Column({ type: 'varchar', length: 32 })
  event!: string;

  /** 失败原因码（仅失败事件） */
  @Column({ type: 'varchar', length: 64, nullable: true })
  failCode!: string | null;

  /** 网络类型 wifi/4g/5g 等 */
  @Column({ type: 'varchar', length: 16, nullable: true })
  networkType!: string | null;

  /** 系统版本 */
  @Column({ type: 'varchar', length: 32, nullable: true })
  osVersion!: string | null;

  /** 设备型号 */
  @Column({ type: 'varchar', length: 64, nullable: true })
  deviceModel!: string | null;

  /** 耗时（毫秒，如下载/安装耗时） */
  @Column({ type: 'integer', nullable: true })
  costMs!: number | null;

  /** 上报时间戳（毫秒） */
  @Column({ type: 'integer' })
  createdAt!: number;
}
