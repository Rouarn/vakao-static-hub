/**
 * 响应拦截器
 * 统一包装 API 响应为标准格式
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * API 响应接口
 * 定义统一的响应格式
 */
interface ApiResponse<T = unknown> {
  code: number; // 响应码
  message: string; // 响应消息
  data: T | null; // 响应数据
}

/**
 * 响应拦截器类
 * 将控制器返回的数据包装为统一的 API 响应格式
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  /**
   * 拦截响应并包装格式
   * @param context 执行上下文
   * @param next 调用处理器
   * @returns 包装后的响应 Observable
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiResponse<unknown>> {
    return next.handle().pipe(
      map((data: unknown) => ({
        code: 200, // 成功状态码
        message: '成功', // 成功消息
        data: data ?? null, // 响应数据，如果为空则为 null
      })),
    );
  }
}
