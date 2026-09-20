import {
  Injectable,
  NestMiddleware,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import type { RequestHandler } from 'express';
import type { ClientRequest } from 'http';
import type { Socket } from 'net';

@Injectable()
export class HitokotoProxyMiddleware implements NestMiddleware, OnModuleInit {
  private readonly logger = new Logger(HitokotoProxyMiddleware.name);
  private proxy: RequestHandler | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const target =
      this.configService.get<string>('HITOKOTO_API_URL') ||
      process.env.HITOKOTO_API_URL ||
      '';

    if (!target) {
      this.logger.warn('Hitokoto 代理目标未配置，代理已禁用');
      return;
    }

    this.logger.log(`Hitokoto 代理中间件初始化，目标: ${target}`);

    const { createProxyMiddleware } = await import('http-proxy-middleware');

    this.proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/static/hitokoto': '',
      },
      on: {
        proxyReq: (proxyReq: ClientRequest, req: Request) => {
          const source = req.originalUrl || req.url;
          const targetUrl = `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`;
          this.logger.log(
            `请求代理: [${req.method}] ${source} -> ${targetUrl}`,
          );

          const body = req.body as Record<string, unknown> | undefined;
          if (
            body &&
            typeof body === 'object' &&
            Object.keys(body).length > 0
          ) {
            const bodyData = JSON.stringify(body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }
        },
        error: (
          err: Error,
          _req: Request,
          res: (Response & { headersSent?: boolean }) | Socket,
        ) => {
          this.logger.error(`代理错误: ${err.message}`);
          if (
            res &&
            typeof res === 'object' &&
            'headersSent' in res &&
            !res.headersSent &&
            'status' in res &&
            typeof res.status === 'function'
          ) {
            res.status(502).json({
              statusCode: 502,
              message: 'Bad Gateway - 代理错误',
              error: err.message,
            });
          }
        },
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.proxy) {
      next();
      return;
    }

    void this.proxy(req, res, next);
  }
}
