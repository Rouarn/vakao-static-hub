import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareLinkEntity } from '../../infra/database/entities/share-link.entity.js';
import { ShareController } from './share.controller.js';
import { ShareService } from './share.service.js';
import { FilesModule } from '../files/files.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([ShareLinkEntity]), FilesModule],
  controllers: [ShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
