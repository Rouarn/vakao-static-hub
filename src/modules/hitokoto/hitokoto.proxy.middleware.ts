import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { ConfigService } from '@nestjs/config';
import { ClientRequest, IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';

@Injectable()
export class HitokotoProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HitokotoProxyMiddleware.name);
  private proxy: RequestHandler;

  constructor(private configService: ConfigService) {
    const target =
      this.configService.get<string>('HITOKOTO_API_URL') ||
      process.env.HITOKOTO_API_URL ||
      '';

    this.logger.log(`Hitokoto proxy middleware initialized. Target: ${target}`);

    this.proxy = createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/api/hitokoto': '',
      },
      on: {
        proxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
          const expressReq = req as unknown as Request;

          // 记录转发日志
          const source = expressReq.originalUrl || expressReq.url;
          const targetUrl = `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`;
          this.logger.log(
            `Proxying request: [${req.method}] ${source} -> ${targetUrl}`,
          );

          if (
            expressReq.body &&
            typeof expressReq.body === 'object' &&
            Object.keys(expressReq.body as object).length > 0
          ) {
            const bodyData = JSON.stringify(expressReq.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }
        },
        error: (
          err: Error,
          _req: IncomingMessage,
          res: ServerResponse | Socket,
        ) => {
          this.logger.error(`Proxy error: ${err.message}`);
          if (res instanceof ServerResponse) {
            const expressRes = res as unknown as Response;
            if (!expressRes.headersSent) {
              expressRes.status(502).json({
                statusCode: 502,
                message: 'Bad Gateway - Proxy Error',
                error: err.message,
              });
            }
          }
        },
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const handler = this.proxy as unknown;
    if (typeof handler === 'function') {
      void (
        handler as (
          req: Request,
          res: Response,
          next: NextFunction,
        ) => void | Promise<void>
      )(req, res, next);
    } else {
      next();
    }
  }
}
