import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { FileEntryEntity } from './entities/file-entry.entity';
import { ShareLinkEntity } from './entities/share-link.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const database = configService.get<string>('db.path');
        if (database) {
          await mkdir(dirname(database), { recursive: true });
        }
        return {
          type: 'better-sqlite3' as const,
          database,
          synchronize: configService.get<boolean>('db.synchronize') ?? true,
          entities: [FileEntryEntity, ShareLinkEntity],
        };
      },
    }),
  ],
})
export class DatabaseModule {}
