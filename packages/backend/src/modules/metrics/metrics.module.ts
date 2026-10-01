/**
 * 监控指标模块
 * 提供 GET /metrics 接口（JWT 保护），并通过全局拦截器统计 QPS
 */

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntryEntity } from '#/infra/database/entities/file-entry.entity.js';
import { ShareLinkEntity } from '#/infra/database/entities/share-link.entity.js';
import { AppVersionEntity } from '#/infra/database/entities/app-version.entity.js';
import { AppUpgradeEventEntity } from '#/infra/database/entities/app-upgrade-event.entity.js';
import { UserEntity } from '#/infra/database/entities/user.entity.js';
import { MetricsController } from './metrics.controller.js';
import { MetricsService } from './metrics.service.js';
import { QpsInterceptor } from './qps.interceptor.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FileEntryEntity,
      ShareLinkEntity,
      AppVersionEntity,
      AppUpgradeEventEntity,
      UserEntity,
    ]),
  ],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    // 注册为全局拦截器，统计所有进入的请求用于 QPS 计算
    { provide: APP_INTERCEPTOR, useClass: QpsInterceptor },
  ],
})
export class MetricsModule {}
