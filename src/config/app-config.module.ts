import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { serverConfigFactory } from './server.config';
import { authConfigFactory } from './auth.config';
import { databaseConfigFactory } from './database.config';
import { fileConfigFactory } from './file.config';
import { scheduleConfigFactory } from './schedule.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        serverConfigFactory,
        authConfigFactory,
        databaseConfigFactory,
        fileConfigFactory,
        scheduleConfigFactory,
      ],
    }),
  ],
})
export class AppConfigModule {}
