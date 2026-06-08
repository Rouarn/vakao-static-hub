/**
 * 认证配置
 * 定义用户凭证和 JWT 令牌相关的配置参数
 */

import { registerAs } from '@nestjs/config';

/**
 * 认证配置对象
 * 包含默认用户名、密码和 JWT 签发相关设置
 * @property {string} user - 默认用户名，从环境变量 AUTH_USER 读取
 * @property {string} pass - 默认密码，从环境变量 AUTH_PASS 读取
 * @property {string} jwtSecret - JWT 签名密钥，从环境变量 JWT_SECRET 读取
 * @property {string} jwtExpiresIn - JWT 过期时间，从环境变量 JWT_EXPIRES_IN 读取
 */
export const authConfig = {
  user: process.env.AUTH_USER ?? 'admin',
  pass: process.env.AUTH_PASS ?? 'admin',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-env',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
};

/**
 * 认证配置工厂函数
 * 使用 NestJS ConfigModule 的 registerAs 注册配置命名空间
 */
export const authConfigFactory = registerAs('auth', () => authConfig);
