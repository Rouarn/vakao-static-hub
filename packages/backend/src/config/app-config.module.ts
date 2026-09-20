import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { serverConfigFactory } from './server.config.js';
import { authConfigFactory } from './auth.config.js';
import { databaseConfigFactory } from './database.config.js';
import { fileConfigFactory } from './file.config.js';
import { scheduleConfigFactory } from './schedule.config.js';

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
