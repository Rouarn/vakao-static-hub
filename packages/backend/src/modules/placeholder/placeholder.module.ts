/**
 * 占位图服务模块
 * 提供 SVG 占位图生成功能
 */

import { Module } from '@nestjs/common';
import { PlaceholderController } from './placeholder.controller.js';
import { PlaceholderService } from './placeholder.service.js';

/**
 * 占位图模块类
 * 注册占位图控制器和服务
 */
@Module({
  controllers: [PlaceholderController],
  providers: [PlaceholderService],
})
export class PlaceholderModule {}
