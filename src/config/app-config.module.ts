/**
 * 应用配置模块
 * 聚合所有子配置项，初始化全局配置服务
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { authConfigFactory } from './auth.config';
import { dbConfigFactory } from './db.config';
import { fileConfigFactory } from './file.config';
import { scheduleConfigFactory } from './schedule.config';
import { serverConfigFactory } from './server.config';

/**
 * 应用配置模块
 * 聚合所有子配置项，并初始化全局配置服务
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 设置为全局模块，无需在其他模块中重复导入
      cache: true, // 启用配置缓存，提高性能
      load: [
        serverConfigFactory,
        fileConfigFactory,
        scheduleConfigFactory,
        authConfigFactory,
        dbConfigFactory,
      ], // 加载各个配置工厂
    }),
  ],
})
export class AppConfigModule {}
