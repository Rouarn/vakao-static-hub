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
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { ShareService } from './share.service.js';
import { FilesService } from '../files/files.service.js';
import { CreateShareLinkDto } from './dto/create-share-link.dto.js';
import { getMimeType, isPreviewable } from '../files/utils/mime-types.js';

@ApiTags('分享链接')
@Controller('share')
@UseGuards(JwtAuthGuard)
export class ShareController {
  constructor(
    private readonly shareService: ShareService,
    private readonly filesService: FilesService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建分享链接' })
  async createShareLink(@Body() dto: CreateShareLinkDto) {
    return await this.shareService.createShareLink(dto);
  }

  @Get('list')
  @ApiOperation({ summary: '获取分享链接列表' })
  async listShareLinks() {
    return await this.shareService.listShareLinks();
  }

  @Delete(':token')
  @ApiOperation({ summary: '撤销分享链接' })
  @ApiParam({ name: 'token', description: '分享 token' })
  async revokeShareLink(@Param('token') token: string) {
    return await this.shareService.revokeShareLink(token);
  }

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

      const needsProcessing =
        mimeType.startsWith('image/') && (w || h || q || format);

      if (needsProcessing) {
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', s.size.toString());
        res.setHeader('Cache-Control', 'public, max-age=86400');
        createReadStream(fullPath).pipe(res);
        return;
      }

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
