import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntryEntity } from '../../infra/database/entities/file-entry.entity.js';
import { AppUpgradeEventEntity } from '../../infra/database/entities/app-upgrade-event.entity.js';
import { AppVersionEntity } from '../../infra/database/entities/app-version.entity.js';
import { AppUpdateAdminController } from './app-update-admin.controller.js';
import { AppUpdateAppController } from './app-update-app.controller.js';
import { AppUpdateClientController } from './app-update-client.controller.js';
import { AppUpdateService } from './app-update.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppVersionEntity,
      AppUpgradeEventEntity,
      FileEntryEntity,
    ]),
  ],
  controllers: [
    AppUpdateClientController,
    AppUpdateAppController,
    AppUpdateAdminController,
  ],
  providers: [AppUpdateService],
  exports: [AppUpdateService],
})
export class AppUpdateModule {}
