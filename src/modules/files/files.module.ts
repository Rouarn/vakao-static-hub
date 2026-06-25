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
import { ShareController } from './share.controller';
import { RootsController } from './roots.controller';
import { FilesService } from './files.service';
import { ShareService } from './share.service';
import { ImageProcessorService } from './image-processor.service';

/**
 * 文件模块
 * 负责文件管理功能的组织和依赖注入
 * 包含文件控制器、根目录控制器、文件服务、图片处理服务和文件索引服务
 */
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
  controllers: [FilesController, ShareController, RootsController],
  providers: [
    FilesService,
    ShareService,
    FileIndexService,
    ImageProcessorService,
  ],
  exports: [FilesService, ShareService, ImageProcessorService],
})
export class FilesModule {}
