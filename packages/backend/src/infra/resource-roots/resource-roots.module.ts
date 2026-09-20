/**
 * 资源根目录模块
 * 提供全局的资源根目录管理服务
 */

import { Global, Module } from '@nestjs/common';
import { ResourceRootsService } from './resource-roots.service.js';

/**
 * 资源根目录模块类
 * 使用 @Global() 装饰器标记为全局模块
 * 使得 ResourceRootsService 在整个应用中无需重复导入
 */
@Global()
@Module({
  providers: [ResourceRootsService],
  exports: [ResourceRootsService],
})
export class ResourceRootsModule {}
