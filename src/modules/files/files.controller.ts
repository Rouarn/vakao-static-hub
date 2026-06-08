/**
 * 文件管理控制器
 * 提供文件浏览、上传、下载、删除等 HTTP 接口
 * 支持图片处理（缩放、格式转换、质量调整）和缓存控制
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
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { createReadStream, stat } from 'fs-extra';
import type { Response } from 'express';
import type { Request } from 'express';
import { basename } from 'path';
import { fileConfig } from '../../config/file.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { ListFilesQueryDto } from './dto/list-files-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ImageProcessorService } from './image-processor.service';
import { getMimeType, isPreviewable } from './utils/mime-types';

/**
 * 文件管理控制器类
 * 处理文件操作相关的 HTTP 请求
 */
@ApiTags('文件管理')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly service: FilesService,
    private readonly imageProcessor: ImageProcessorService,
  ) {}

  /**
   * 获取指定根目录下的分类列表
   *
   * @param rootId 根目录 ID
   * @returns 分类名称列表
   */
  @Get(':rootId/categories')
  @ApiOperation({ summary: '获取指定根目录下的分类列表' })
  @ApiParam({ name: 'rootId', description: '根目录 ID' })
  async listCategories(@Param('rootId') rootId: string) {
    return await this.service.listCategories(rootId);
  }

  /**
   * 分页获取文件列表
   * 支持搜索、排序功能
   *
   * @param rootId 根目录 ID
   * @param category 分类目录名（支持嵌套路径）
   * @param query 分页和查询参数
   * @returns 分页结果
   */
  @Get(':rootId/:category')
  @ApiOperation({ summary: '分页获取文件列表' })
  @ApiParam({ name: 'rootId', description: '根目录 ID' })
  @ApiParam({ name: 'category', description: '分类目录名' })
  async listFiles(
    @Param('rootId') rootId: string,
    @Param('category') category: string,
    @Query() query: ListFilesQueryDto,
  ) {
    if (!category) throw new BadRequestException('category is required');
    return await this.service.listFilesPaged(rootId, category, query);
  }

  /**
   * 上传文件到指定根目录和分类
   *
   * @param rootId 根目录 ID
   * @param files 上传的文件列表
   * @param category 分类目录名
   * @returns 上传结果列表
   */
  @Post(':rootId/upload')
  @ApiOperation({ summary: '上传文件' })
  @ApiParam({ name: 'rootId', description: '根目录 ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        category: { type: 'string', description: '分类目录（子目录）' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', fileConfig.maxCount))
  async uploadFiles(
    @Param('rootId') rootId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('category') category: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return await this.service.batchSaveFiles(rootId, category || '', files);
  }

  /**
   * 下载或预览文件
   * 支持断点续传（Range 请求）和缓存控制（ETag）
   * 支持图片压缩处理（w, h, q, format 参数）
   *
   * 注意：此接口已开放为无需认证即可访问，以便作为静态资源服务使用
   *
   * @param rootId 根目录 ID
   * @param category 分类目录名
   * @param rest 文件相对路径（可能为数组）
   * @param isDownload 是否强制下载
   * @param w 图片宽度
   * @param h 图片高度
   * @param q 图片质量 (0-100)
   * @param format 输出格式
   * @param req HTTP 请求对象
   * @param res HTTP 响应对象
   */
  @Public()
  @Get(':rootId/:category/*path')
  @ApiOperation({ summary: '下载或预览文件' })
  @ApiParam({ name: 'rootId', description: '根目录 ID' })
  @ApiParam({ name: 'category', description: '分类目录名' })
  @ApiParam({ name: 'path', description: '文件相对路径' })
  @ApiQuery({ name: 'download', required: false, description: '是否强制下载' })
  @ApiQuery({ name: 'w', required: false, description: '图片宽度' })
  @ApiQuery({ name: 'h', required: false, description: '图片高度' })
  @ApiQuery({ name: 'q', required: false, description: '图片质量 (0-100)' })
  @ApiQuery({ name: 'format', required: false, description: '输出格式' })
  async serveFile(
    @Param('rootId') rootId: string,
    @Param('category') category: string,
    @Param('path') rest: string[] | string,
    @Query('download') isDownload: string | undefined,
    @Query('w') w: string | undefined,
    @Query('h') h: string | undefined,
    @Query('q') q: string | undefined,
    @Query('format') format: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!category) throw new BadRequestException('category is required');

    const filename = Array.isArray(rest) ? rest.join('/') : rest;
    if (!filename || typeof filename !== 'string') {
      throw new BadRequestException('Invalid file path');
    }

    try {
      const fullPath = this.service.safeJoinCategory(rootId, category, [
        filename,
      ]);
      const s = await stat(fullPath);
      const mimeType = getMimeType(filename);

      // 判断是否需要图片处理
      const needsProcessing =
        mimeType.startsWith('image/') && (w || h || q || format);

      if (needsProcessing) {
        await this.serveProcessedImage(fullPath, w, h, q, format, res);
        return;
      }

      // 直接返回静态文件
      this.serveStaticFile(fullPath, filename, s, req, res, isDownload);
    } catch {
      throw new NotFoundException('File not found');
    }
  }

  /**
   * 提供静态文件服务
   * 支持 ETag 缓存验证和 Content-Disposition 处理
   *
   * @param fullPath 文件完整路径
   * @param filename 文件名
   * @param stats 文件统计信息
   * @param req HTTP 请求对象
   * @param res HTTP 响应对象
   * @param isDownload 是否强制下载
   */
  private serveStaticFile(
    fullPath: string,
    filename: string,
    stats: { size: number; mtime: Date; mtimeMs: number },
    req: Request,
    res: Response,
    isDownload?: string,
  ) {
    const mimeType = getMimeType(filename);

    // 生成 ETag 用于缓存验证
    const etag = `W/"${stats.size}-${stats.mtimeMs}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', stats.mtime.toUTCString());
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');

    // 处理协商缓存
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    res.setHeader('Content-Length', stats.size.toString());
    res.setHeader('Content-Type', mimeType);

    // 判断是否可以在浏览器内预览
    const disposition =
      isPreviewable(mimeType) && isDownload === undefined
        ? 'inline'
        : 'attachment';

    // 设置 Content-Disposition 头
    if (disposition === 'attachment') {
      const encodedFilename = encodeURIComponent(basename(filename));
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodedFilename}`,
      );
    } else {
      res.setHeader('Content-Disposition', disposition);
    }

    // 流式传输文件
    createReadStream(fullPath).pipe(res);
  }

  /**
   * 处理并返回压缩后的图片
   *
   * @param fullPath 源图片路径
   * @param w 目标宽度
   * @param h 目标高度
   * @param q 图片质量
   * @param format 输出格式
   * @param res HTTP 响应对象
   */
  private async serveProcessedImage(
    fullPath: string,
    w: string | undefined,
    h: string | undefined,
    q: string | undefined,
    format: string | undefined,
    res: Response,
  ) {
    const width = w ? parseInt(w, 10) : undefined;
    const height = h ? parseInt(h, 10) : undefined;
    const quality = q ? Math.min(100, Math.max(1, parseInt(q, 10))) : 80;
    const outputFormat = format || 'webp';

    // 使用图片处理服务处理图片
    const { buffer, mimeType } = await this.imageProcessor.processImage(
      fullPath,
      width,
      height,
      quality,
      outputFormat,
    );

    // 设置响应头
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  }

  /**
   * 删除文件
   *
   * @param rootId 根目录 ID
   * @param category 分类目录名
   * @param path 文件相对路径（可能为数组）
   * @returns 操作结果
   */
  @Delete(':rootId/:category/*path')
  @ApiOperation({ summary: '删除文件' })
  @ApiParam({ name: 'rootId', description: '根目录 ID' })
  @ApiParam({ name: 'category', description: '分类目录名' })
  @ApiParam({ name: 'path', description: '文件相对路径' })
  async deleteFile(
    @Param('rootId') rootId: string,
    @Param('category') category: string,
    @Param('path') path: string[] | string,
  ) {
    const filename = Array.isArray(path) ? path.join('/') : path;
    try {
      await this.service.deleteFile(rootId, category, filename);
      return { success: true };
    } catch {
      throw new NotFoundException('File not found');
    }
  }
}
