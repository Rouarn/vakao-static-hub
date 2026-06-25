/**
 * 服务器配置
 * 定义服务器运行的基本配置参数
 */

import { join } from 'path';
import { registerAs } from '@nestjs/config';

/** 当前工作目录 */
const cwd = process.cwd();

/**
 * 前端静态资源目录
 * 生产环境：web 目录 (deploy/web)
 * 仅在生产环境（部署后）存在
 */
const webDir = join(cwd, 'web');

/**
 * 服务器配置对象
 * @property {number} port - 服务监听端口，默认 9865
 * @property {string|number} bodyLimit - 请求体大小限制，默认 10MB
 * @property {string} staticPrefix - 静态文件 URL 前缀
 * @property {string} publicDir - 静态前端资源目录路径
 */
export const serverConfig = {
  port: Number(process.env.PORT ?? 9865),
  bodyLimit: process.env.BODY_LIMIT ?? 10485760, // 10mb
  staticPrefix: process.env.STATIC_PREFIX ?? 'static',
  publicDir: webDir, // 静态前端资源目录（仅在存在时挂载）
};

/**
 * 服务器配置工厂函数
 * 使用 NestJS ConfigModule 的 registerAs 注册配置命名空间
 */
export const serverConfigFactory = registerAs('server', () => serverConfig);
