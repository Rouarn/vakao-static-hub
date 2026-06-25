/**
 * 分享链接控制器
 * 提供分享链接的创建、列表、撤销和公开访问接口
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream, stat } from 'fs-extra';
import { basename } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ShareService } from './share.service';
import { FilesService } from './files.service';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { getMimeType, isPreviewable } from './utils/mime-types';

/**
 * 分享链接控制器类
 * 处理分享链接相关的 HTTP 请求
 */
@ApiTags('分享链接')
@Controller('share')
@UseGuards(JwtAuthGuard)
export class ShareController {
  constructor(
    private readonly shareService: ShareService,
    private readonly filesService: FilesService,
  ) {}

  /**
   * 创建分享链接
   *
   * @param dto 创建分享链接参数
   * @returns 创建的分享链接信息
   */
  @Post()
  @ApiOperation({ summary: '创建分享链接' })
  async createShareLink(@Body() dto: CreateShareLinkDto) {
    return await this.shareService.createShareLink(dto);
  }

  /**
   * 获取所有分享链接列表
   *
   * @returns 分享链接列表
   */
  @Get('list')
  @ApiOperation({ summary: '获取分享链接列表' })
  async listShareLinks() {
    return await this.shareService.listShareLinks();
  }

  /**
   * 撤销分享链接
   *
   * @param token 分享 token
   * @returns 操作结果
   */
  @Delete(':token')
  @ApiOperation({ summary: '撤销分享链接' })
  @ApiParam({ name: 'token', description: '分享 token' })
  async revokeShareLink(@Param('token') token: string) {
    return await this.shareService.revokeShareLink(token);
  }

  /**
   * 公开访问分享链接的文件
   * 无需认证，通过 token 验证访问权限
   *
   * @param token 分享 token
   * @param isDownload 是否强制下载
   * @param w 图片宽度
   * @param h 图片高度
   * @param q 图片质量
   * @param format 输出格式
   * @param res HTTP 响应对象
   */
  @Public()
  @Get(':token')
  @ApiOperation({ summary: '通过分享链接访问文件' })
  @ApiParam({ name: 'token', description: '分享 token' })
  async accessShareLink(
    @Param('token') token: string,
    @Query('download') isDownload: string | undefined,
    @Query('w') w: string | undefined,
    @Query('h') h: string | undefined,
    @Query('q') q: string | undefined,
    @Query('format') format: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const linkInfo = await this.shareService.validateAndAccess(token);

      const fullPath = this.filesService.safeJoinCategory(
        linkInfo.rootId,
        linkInfo.category,
        [linkInfo.filePath],
      );

      const s = await stat(fullPath);
      const mimeType = getMimeType(linkInfo.filePath);

      // 判断是否需要图片处理
      const needsProcessing =
        mimeType.startsWith('image/') && (w || h || q || format);

      if (needsProcessing) {
        // 简化处理：直接返回原始文件（图片处理服务需要额外导入）
        // 如需图片处理，可在此处扩展
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', s.size.toString());
        res.setHeader('Cache-Control', 'public, max-age=86400');
        createReadStream(fullPath).pipe(res);
        return;
      }

      // 直接返回静态文件
      const disposition =
        isPreviewable(mimeType) && isDownload === undefined
          ? 'inline'
          : 'attachment';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', s.size.toString());
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

      if (disposition === 'attachment') {
        const encodedFilename = encodeURIComponent(basename(linkInfo.filePath));
        res.setHeader(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodedFilename}`,
        );
      } else {
        res.setHeader('Content-Disposition', disposition);
      }

      createReadStream(fullPath).pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({ message: '分享链接不存在' });
      } else if (error instanceof BadRequestException) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: '访问文件失败' });
      }
    }
  }
}
