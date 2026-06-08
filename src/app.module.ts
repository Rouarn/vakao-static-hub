/**
 * 应用程序根模块
 * 定义应用的整体结构，导入子模块、控制器和服务
 */

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './infra/database/database.module';
import { ResourceRootsModule } from './infra/resource-roots/resource-roots.module';
import { AuthModule } from './modules/auth/auth.module';
import { FilesModule } from './modules/files/files.module';
import { PhotoModule } from './modules/photo/photo.module';
import { PlaceholderModule } from './modules/placeholder/placeholder.module';
import { HitokotoModule } from './modules/hitokoto/hitokoto.module';

/**
 * 根应用模块类
 * 导入文件模块和图片模块，注册主控制器和服务
 */
@Module({
  imports: [
    AppConfigModule,
    EventEmitterModule.forRoot({ global: true }),
    DatabaseModule,
    ResourceRootsModule,
    AuthModule,
    FilesModule,
    PhotoModule,
    PlaceholderModule,
    HitokotoModule,
  ], // 导入子模块
  controllers: [AppController], // 注册控制器
  providers: [AppService], // 注册服务提供者
})
export class AppModule {}
