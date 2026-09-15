/**
 * APP 应用管理接口（JWT 鉴权）
 * 应用 = apk 资源根下的分类目录（xiaolv / xiaolan…），每个应用独立维护版本
 */

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppUpdateService } from './app-update.service';
import { CreateAppDto } from './dto/create-app.dto';

@ApiTags('APP 更新（管理端）')
@ApiBearerAuth()
@Controller('app-updates/apps')
@UseGuards(JwtAuthGuard)
export class AppUpdateAppController {
  constructor(private readonly service: AppUpdateService) {}

  @Get()
  @ApiOperation({ summary: '获取全部应用标识（apk 根下的分类目录）' })
  async list() {
    return await this.service.listApps();
  }

  @Post()
  @ApiOperation({ summary: '新建应用（创建应用目录）' })
  async create(@Body() dto: CreateAppDto) {
    return await this.service.createApp(dto.appKey);
  }
}
