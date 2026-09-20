import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/app-config.module.js';
import { DatabaseModule } from './infra/database/database.module.js';
import { ResourceRootsModule } from './infra/resource-roots/resource-roots.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { FilesModule } from './modules/files/files.module.js';
import { ShareModule } from './modules/share/share.module.js';
import { RootsModule } from './modules/roots/roots.module.js';
import { PhotoModule } from './modules/photo/photo.module.js';
import { PlaceholderModule } from './modules/placeholder/placeholder.module.js';
import { HitokotoModule } from './modules/hitokoto/hitokoto.module.js';
import { AppUpdateModule } from './modules/app-update/app-update.module.js';

@Module({
  imports: [
    AppConfigModule,
    EventEmitterModule.forRoot({ global: true }),
    DatabaseModule,
    ResourceRootsModule,
    AuthModule,
    FilesModule,
    ShareModule,
    RootsModule,
    PhotoModule,
    PlaceholderModule,
    HitokotoModule,
    AppUpdateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
