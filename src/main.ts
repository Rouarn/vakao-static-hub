/**
 * 应用程序入口文件
 * 负责初始化和启动 NestJS 应用服务器
 */

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as express from 'express';
import { ensureDir, pathExists } from 'fs-extra';
import { join } from 'path';
import { serverConfig } from './config/server.config';
import { fileConfig } from './config/file.config';
import { ResponseInterceptor } from './common/response.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * 应用启动引导函数
 * 配置中间件、全局拦截器、过滤器，并启动服务器
 */
async function bootstrap() {
  // 创建 NestJS 应用实例
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // 给所有 API 路由添加统一前缀 api
  app.setGlobalPrefix(serverConfig.staticPrefix);

  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 配置 JSON 和 URL 编码中间件，设置请求体大小限制
  app.use(
    json({
      limit:
        configService.get<string>('server.bodyLimit') ?? serverConfig.bodyLimit,
    }),
  );
  app.use(urlencoded({ extended: true }));

  // 注册全局响应拦截器，统一包装响应格式
  app.useGlobalInterceptors(new ResponseInterceptor());
  // 注册全局异常过滤器，统一处理错误响应
  app.useGlobalFilters(new HttpExceptionFilter());
  // 注册全局验证管道，自动验证和转换请求参数
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 配置 Swagger API 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Vakao Static Hub 接口文档')
    .setDescription('静态资源托管服务的后端 API 文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDoc);

  // 确保文件根目录存在
  if (fileConfig.root) await ensureDir(fileConfig.root);

  // 配置静态文件服务（仅在生产环境/部署模式下挂载前端资源）
  let indexHtmlPath: string | null = null;
  if (await pathExists(serverConfig.publicDir)) {
    app.use(express.static(serverConfig.publicDir));
    indexHtmlPath = join(serverConfig.publicDir, 'index.html');
  }

  // SPA fallback 中间件
  // 自动判断：有文件扩展名的请求视为静态资源/API，无扩展名且接受 HTML 的请求返回 index.html
  // 排除 API 路径前缀
  if (indexHtmlPath && (await pathExists(indexHtmlPath))) {
    const httpAdapter = app.getHttpAdapter();
    const instance = httpAdapter.getInstance() as express.Application;
    const hasExtension = (path: string) =>
      /\.[a-zA-Z0-9]+$/.test(path.split('?')[0]);
    const isApiPath = (path: string) =>
      path.startsWith(`/${serverConfig.staticPrefix}`) ||
      path.startsWith('/docs');

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
  }

  // 启动服务器监听指定端口
  const port = configService.get<number>('server.port') ?? serverConfig.port;
  await app.listen(port);

  logger.log(`Server running on port http://localhost:${port}`);
}

// 执行引导函数
void bootstrap();
