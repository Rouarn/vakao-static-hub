import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';

@Injectable()
export class ConfigurableFilesInterceptor implements NestInterceptor {
  private readonly interceptor: NestInterceptor;

  constructor(private readonly configService: ConfigService) {
    const maxCount = this.configService.get<number>('files.maxCount') ?? 20;
    const InterceptorClass = FilesInterceptor('files', maxCount);
    this.interceptor = new InterceptorClass();
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> | Promise<Observable<unknown>> {
    return this.interceptor.intercept(context, next);
  }
}
