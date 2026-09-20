/**
 * APP 更新管理端接口（JWT 鉴权）
 * 上传 APK、版本 CRUD、发布/灰度、强更开关、下架止血
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { AppUpdateService } from './app-update.service.js';
import { ApkUploadInterceptor } from './apk-upload.interceptor.js';
import { CreateVersionDto } from './dto/create-version.dto.js';
import { ForceUpdateDto } from './dto/force-update.dto.js';
import { ListVersionsQueryDto } from './dto/list-versions-query.dto.js';
import { PublishVersionDto } from './dto/publish-version.dto.js';
import { UpdateVersionDto } from './dto/update-version.dto.js';

@ApiTags('APP 更新（管理端）')
@ApiBearerAuth()
@Controller('app-updates/versions')
@UseGuards(JwtAuthGuard)
export class AppUpdateAdminController {
  constructor(private readonly service: AppUpdateService) {}

  @Post()
  @ApiOperation({
    summary: '上传 APK 并创建草稿版本（自动计算大小与 SHA-256）',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'appKey', 'versionName', 'versionCode'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'APK 安装包' },
        appKey: {
          type: 'string',
          example: 'xiaolv',
          description: '应用标识（需先创建应用）',
        },
        versionName: { type: 'string', example: '1.0.1' },
        versionCode: { type: 'string', example: '101' },
        updateLog: { type: 'string', description: '更新说明，支持换行' },
        remark: { type: 'string' },
      },
    },
  })
  @UseInterceptors(ApkUploadInterceptor())
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateVersionDto,
  ) {
    return await this.service.createVersion(file, dto);
  }

  @Get()
  @ApiOperation({ summary: '分页版本列表（可按状态/渠道筛选）' })
  async list(@Query() query: ListVersionsQueryDto) {
    return await this.service.listVersions(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '版本详情' })
  @ApiParam({ name: 'id' })
  async detail(@Param('id', ParseIntPipe) id: number) {
    return await this.service.getVersion(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '编辑元数据（仅草稿/已下架可改）' })
  @ApiParam({ name: 'id' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVersionDto,
  ) {
    return await this.service.updateVersion(id, dto);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布版本（full 全量 / gray 灰度，带门禁校验）' })
  @ApiParam({ name: 'id' })
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishVersionDto,
  ) {
    return await this.service.publishVersion(id, dto);
  }

  @Put(':id/force')
  @ApiOperation({ summary: '远程修改强更开关（逃生口，无需重新发版）' })
  @ApiParam({ name: 'id' })
  async setForce(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ForceUpdateDto,
  ) {
    return await this.service.setForce(id, dto);
  }

  @Post(':id/offline')
  @ApiOperation({ summary: '一键下架（止血开关，文件保留）' })
  @ApiParam({ name: 'id' })
  async offline(@Param('id', ParseIntPipe) id: number) {
    return await this.service.offline(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '逻辑删除记录（仅草稿/已下架，物理文件保留）' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.service.remove(id);
  }
}
