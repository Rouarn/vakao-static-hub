/**
 * QPS 统计拦截器
 * 全局记录每个进入的 HTTP 请求，写入 MetricsService 的滑动窗口计数器
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MetricsService } from './metrics.service.js';

@Injectable()
export class QpsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // 只统计 HTTP 请求；记录动作本身同步完成，不影响后续处理链路
    if (context.getType() === 'http') {
      this.metricsService.recordRequest();
    }
    return next.handle();
  }
}
