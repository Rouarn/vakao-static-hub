import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ResourceRootsService } from '../../infra/resource-roots/resource-roots.service.js';
import {
  CreateResourceRootDto,
  UpdateResourceRootDto,
} from './dto/resource-root.dto.js';
import { FilesService } from '../files/files.service.js';

@ApiTags('资源根目录管理')
@Controller('roots')
@UseGuards(JwtAuthGuard)
export class RootsController {
  constructor(
    private readonly resourceRoots: ResourceRootsService,
    private readonly filesService: FilesService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取存储根目录列表' })
  getRoots() {
    return this.resourceRoots.getRoots();
  }

  @Post()
  @ApiOperation({ summary: '添加存储根目录' })
  async addRoot(@Body() body: CreateResourceRootDto) {
    if (body.id === 'roots') {
      throw new BadRequestException('Invalid ID');
    }
    await this.resourceRoots.addRoot(body);
    return this.resourceRoots.getRoots();
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除存储根目录' })
  @ApiParam({ name: 'id', description: '根目录 ID' })
  async removeRoot(@Param('id') id: string) {
    await this.resourceRoots.removeRoot(id);
    return { success: true };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新存储根目录' })
  @ApiParam({ name: 'id', description: '根目录 ID' })
  async updateRoot(
    @Param('id') id: string,
    @Body() body: UpdateResourceRootDto,
  ) {
    await this.resourceRoots.updateRoot(id, body);
    return this.resourceRoots.getRoots();
  }

  @Get('system/directories')
  @ApiOperation({ summary: '浏览服务器系统目录' })
  @ApiQuery({ name: 'path', required: false, description: '要浏览的目录路径' })
  async browseDirectories(@Query('path') path?: string) {
    try {
      return await this.filesService.listSystemDirectories(path);
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : String(e));
    }
  }
}
