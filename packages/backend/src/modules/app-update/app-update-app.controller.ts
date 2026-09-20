/**
 * APP 应用管理接口（JWT 鉴权）
 * 应用 = software-update 资源根下的分类目录（xiaolv / xiaolan…），每个应用独立维护版本
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AppUpdateService } from './app-update.service.js';
import { CreateAppDto } from './dto/create-app.dto.js';
import { RenameAppDto } from './dto/rename-app.dto.js';

@ApiTags('APP 更新（管理端）')
@ApiBearerAuth()
@Controller('app-updates/apps')
@UseGuards(JwtAuthGuard)
export class AppUpdateAppController {
  constructor(private readonly service: AppUpdateService) {}

  @Get()
  @ApiOperation({
    summary: '获取全部应用标识（software-update 根下的分类目录）',
  })
  async list() {
    return await this.service.listApps();
  }

  @Post()
  @ApiOperation({ summary: '新建应用（创建应用目录）' })
  async create(@Body() dto: CreateAppDto) {
    return await this.service.createApp(dto.appKey);
  }

  @Patch(':appKey')
  @ApiOperation({
    summary: '修改应用标识（重命名目录并迁移全部关联记录）',
  })
  async rename(@Param('appKey') appKey: string, @Body() dto: RenameAppDto) {
    return await this.service.renameApp(appKey, dto.newAppKey);
  }

  @Delete(':appKey')
  @ApiOperation({
    summary: '删除应用（删除目录、全部版本/事件记录与文件索引，不可恢复）',
  })
  async remove(@Param('appKey') appKey: string) {
    return await this.service.deleteApp(appKey);
  }
}
