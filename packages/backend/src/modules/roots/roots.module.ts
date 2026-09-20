import { Module } from '@nestjs/common';
import { ResourceRootsModule } from '../../infra/resource-roots/resource-roots.module.js';
import { FilesModule } from '../files/files.module.js';
import { RootsController } from './roots.controller.js';

@Module({
  imports: [ResourceRootsModule, FilesModule],
  controllers: [RootsController],
})
export class RootsModule {}
