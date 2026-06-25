/**
 * 数据库模块
 * 配置 TypeORM 连接 Better SQLite3 数据库，管理数据库实体
 */

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ensureDir } from 'fs-extra';
import { dirname } from 'path';
import { FileEntryEntity } from './entities/file-entry.entity';
import { ShareLinkEntity } from './entities/share-link.entity';

/**
 * 数据库模块
 * 配置 TypeORM 连接 Better SQLite3 数据库，管理数据库实体
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const database = configService.get<string>('db.path');
        // 确保数据库文件所在的目录存在
        if (database) {
          await ensureDir(dirname(database));
        }
        return {
          type: 'better-sqlite3',
          database,
          synchronize: configService.get<boolean>('db.synchronize') ?? true, // 自动同步实体结构到数据库表
          entities: [FileEntryEntity, ShareLinkEntity], // 注册实体
        };
      },
    }),
  ],
})
export class DatabaseModule {}
