/**
 * 数据库配置
 * 定义 SQLite 数据库的存储路径和同步设置
 */

import { registerAs } from '@nestjs/config';
import { join, resolve } from 'path';

/**
 * 数据库配置对象
 * @property {string} path - 数据库文件路径，默认为 resources/vakao.db
 * @property {boolean} synchronize - 是否自动同步实体结构到数据库表
 */
export const dbConfig = {
  path: resolve(
    process.env.DB_PATH ?? join(process.cwd(), 'resources', 'vakao.db'),
  ),
  synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
};

/**
 * 数据库配置工厂函数
 * 使用 NestJS ConfigModule 的 registerAs 注册配置命名空间
 */
export const dbConfigFactory = registerAs('db', () => dbConfig);
