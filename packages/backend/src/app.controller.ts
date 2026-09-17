/**
 * 应用程序主控制器
 * 处理根路径下的基本请求，如健康检查
 */

import { Controller, Get } from '@nestjs/common';

/**
 * 主应用控制器类
 * 提供应用状态检查等基础功能
 */
@Controller()
export class AppController {
  /**
   * 健康检查端点
   * @returns 应用状态信息
   */
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
