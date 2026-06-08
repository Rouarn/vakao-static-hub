/**
 * 资源根目录管理控制器
 * 提供资源根目录的 CRUD 操作接口
 * 包括获取列表、添加、更新、删除和浏览服务器目录
 */

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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourceRootsService } from '../../infra/resource-roots/resource-roots.service';
import {
  CreateResourceRootDto,
  UpdateResourceRootDto,
} from './dto/create-resource-root.dto';
import { FilesService } from './files.service';

/**
 * 资源根目录管理控制器类
 * 处理与资源根目录相关的 HTTP 请求
 */
@ApiTags('资源根目录管理')
@Controller('roots')
@UseGuards(JwtAuthGuard)
export class RootsController {
  constructor(
    private readonly resourceRoots: ResourceRootsService,
    private readonly filesService: FilesService,
  ) {}

  /**
   * 获取所有资源根目录列表
   *
   * @returns 资源根目录列表
   */
  @Get()
  @ApiOperation({ summary: '获取存储根目录列表' })
  getRoots() {
    return this.resourceRoots.getRoots();
  }

  /**
   * 添加新的资源根目录
   *
   * @param body 创建资源根目录的 DTO
   * @returns 更新后的资源根目录列表
   * @throws BadRequestException 如果 ID 无效
   */
  @Post()
  @ApiOperation({ summary: '添加存储根目录' })
  async addRoot(@Body() body: CreateResourceRootDto) {
    // 防止使用保留的 ID
    if (body.id === 'roots') {
      throw new BadRequestException('Invalid ID');
    }
    await this.resourceRoots.addRoot(body);
    return this.resourceRoots.getRoots();
  }

  /**
   * 删除指定的资源根目录
   *
   * @param id 根目录 ID
   * @returns 操作结果
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除存储根目录' })
  @ApiParam({ name: 'id', description: '根目录 ID' })
  async removeRoot(@Param('id') id: string) {
    await this.resourceRoots.removeRoot(id);
    return { success: true };
  }

  /**
   * 更新指定的资源根目录
   *
   * @param id 根目录 ID
   * @param body 更新内容
   * @returns 更新后的资源根目录列表
   */
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

  /**
   * 浏览服务器系统目录
   * 用于在添加根目录时选择路径
   *
   * @param path 可选的父目录路径，不传则列出根目录或驱动器
   * @returns 目录列表
   */
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
