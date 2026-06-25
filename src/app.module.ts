import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './infra/database/database.module';
import { ResourceRootsModule } from './infra/resource-roots/resource-roots.module';
import { AuthModule } from './modules/auth/auth.module';
import { FilesModule } from './modules/files/files.module';
import { ShareModule } from './modules/share/share.module';
import { RootsModule } from './modules/roots/roots.module';
import { PhotoModule } from './modules/photo/photo.module';
import { PlaceholderModule } from './modules/placeholder/placeholder.module';
import { HitokotoModule } from './modules/hitokoto/hitokoto.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
