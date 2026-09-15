import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntryEntity } from '../../infra/database/entities/file-entry.entity';
import { AppUpgradeEventEntity } from '../../infra/database/entities/app-upgrade-event.entity';
import { AppVersionEntity } from '../../infra/database/entities/app-version.entity';
import { AppUpdateAdminController } from './app-update-admin.controller';
import { AppUpdateAppController } from './app-update-app.controller';
import { AppUpdateClientController } from './app-update-client.controller';
import { AppUpdateService } from './app-update.service';

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
