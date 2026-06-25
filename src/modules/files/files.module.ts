import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { parseSize } from '../../utils/size.util';
import { FileEntryEntity } from '../../infra/database/entities/file-entry.entity';
import { ShareLinkEntity } from '../../infra/database/entities/share-link.entity';
import { ResourceRootsModule } from '../../infra/resource-roots/resource-roots.module';
import { FileIndexService } from './file-index.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ImageProcessorService } from './image-processor.service';
import { ConfigurableFilesInterceptor } from '../../common/interceptors/configurable-files.interceptor';

@Module({
  imports: [
    ResourceRootsModule,
    TypeOrmModule.forFeature([FileEntryEntity, ShareLinkEntity]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        limits: {
          fileSize: parseSize(configService.get<string>('server.bodyLimit')),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    FileIndexService,
    ImageProcessorService,
    ConfigurableFilesInterceptor,
  ],
  exports: [FilesService, ImageProcessorService],
})
export class FilesModule {}
