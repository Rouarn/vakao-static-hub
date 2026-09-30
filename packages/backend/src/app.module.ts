import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/app-config.module.js';
import { DatabaseModule } from './infra/database/database.module.js';
import { ResourceRootsModule } from './infra/resource-roots/resource-roots.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { ShareModule } from './modules/share/share.module.js';
import { RootsModule } from './modules/roots/roots.module.js';
import { PhotoModule } from './modules/photo/photo.module.js';
import { PlaceholderModule } from './modules/placeholder/placeholder.module.js';
import { HitokotoModule } from './modules/hitokoto/hitokoto.module.js';
import { AppUpdateModule } from './modules/app-update/app-update.module.js';
import { AuditLogModule } from './modules/audit-log/audit-log.module.js';
import { MetricsModule } from './modules/metrics/metrics.module.js';

@Module({
  imports: [
    AppConfigModule,
    EventEmitterModule.forRoot({ global: true }),
    // 全局限流：默认每 IP 每分钟 300 次；登录等敏感接口单独用 @Throttle 收紧
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    DatabaseModule,
    ResourceRootsModule,
    AuthModule,
    FilesModule,
    ShareModule,
    RootsModule,
    PhotoModule,
    PlaceholderModule,
    HitokotoModule,
    AppUpdateModule,
    AuditLogModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
