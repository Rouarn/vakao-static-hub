import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { json, urlencoded } from 'express';
import * as express from 'express';
import { mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { ResponseInterceptor } from './common/response.interceptor.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ServerConfig } from './config/server.config.js';
import type { FileConfig } from './config/file.config.js';

class CustomLogger extends ConsoleLogger {
  protected getTimestamp(): string {
    return new Date().toLocaleString('sv-SE', { hour12: false });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger(),
  });
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  const serverCfg = configService.get<ServerConfig>('server');
  const fileCfg = configService.get<FileConfig>('files');

  app.setGlobalPrefix(serverCfg?.staticPrefix ?? 'static');

  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(
    json({
      limit: serverCfg?.bodyLimit ?? '10mb',
    }),
  );
  app.use(urlencoded({ extended: true }));

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vakao Static Hub 接口文档')
    .setDescription('静态资源托管服务的后端 API 文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDoc);

  if (fileCfg?.root) {
    await mkdir(fileCfg.root, { recursive: true });
  }

  const staticPrefix = serverCfg?.staticPrefix ?? 'static';
  const webDir = join(process.cwd(), 'web');

  try {
    await access(webDir);
    app.use(express.static(webDir));
    const indexHtmlPath = join(webDir, 'index.html');

    try {
      await access(indexHtmlPath);
      const httpAdapter = app.getHttpAdapter();
      const instance = httpAdapter.getInstance() as express.Application;

      const hasExtension = (path: string) =>
        /\.[a-zA-Z0-9]+$/.test(path.split('?')[0]);
      const isApiPath = (path: string) =>
        path.startsWith(`/${staticPrefix}`) || path.startsWith('/docs');

      instance.use(
        (
          req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ) => {
          if (
            req.method === 'GET' &&
            !hasExtension(req.path) &&
            !isApiPath(req.path) &&
            (req.headers.accept || '').includes('text/html')
          ) {
            return res.sendFile(indexHtmlPath);
          }
          return next();
        },
      );
    } catch {
      // index.html not found
    }
  } catch {
    // webDir not found
  }

  const port = serverCfg?.port ?? 9865;
  await app.listen(port);

  logger.log(`客户端已启动，监听端口：http://localhost:9867`);
  logger.log(`服务端已启动，监听端口: http://localhost:${port}`);
}

void bootstrap();
