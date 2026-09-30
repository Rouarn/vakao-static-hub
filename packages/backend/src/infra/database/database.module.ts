import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { FileEntryEntity } from './entities/file-entry.entity.js';
import { ShareLinkEntity } from './entities/share-link.entity.js';
import { ShareAccessLogEntity } from './entities/share-access-log.entity.js';
import { AppVersionEntity } from './entities/app-version.entity.js';
import { AppUpgradeEventEntity } from './entities/app-upgrade-event.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { AuditLogEntity } from './entities/audit-log.entity.js';

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
          type: 'sqljs' as const,
          location: database,
          autoSave: true,
          synchronize: configService.get<boolean>('db.synchronize') ?? false,
          entities: [
            FileEntryEntity,
            ShareLinkEntity,
            ShareAccessLogEntity,
            AppVersionEntity,
            AppUpgradeEventEntity,
            UserEntity,
            AuditLogEntity,
          ],
        };
      },
    }),
  ],
})
export class DatabaseModule {}
