import { registerAs } from '@nestjs/config';
import { join, resolve } from 'path';

export interface DatabaseConfig {
  path: string;
  synchronize: boolean;
}

export const databaseConfigFactory = registerAs('db', (): DatabaseConfig => ({
  path: resolve(
    process.env.DB_PATH ?? join(process.cwd(), 'storage', 'vakao.db'),
  ),
  // 默认关闭自动同步，防止实体变更在生产环境自动 DROP/ALTER 表导致数据丢失；
  // 仅首次部署初始化表结构时通过 DB_SYNCHRONIZE=true 显式开启
  synchronize: (process.env.DB_SYNCHRONIZE ?? 'false') === 'true',
}));
