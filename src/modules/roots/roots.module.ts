import { Module } from '@nestjs/common';
import { ResourceRootsModule } from '../../infra/resource-roots/resource-roots.module';
import { FilesModule } from '../files/files.module';
import { RootsController } from './roots.controller';

@Module({
  imports: [ResourceRootsModule, FilesModule],
  controllers: [RootsController],
})
export class RootsModule {}
