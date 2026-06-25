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
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { ListFilesQueryDto } from './dto/list-files-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ImageProcessorService } from './image-processor.service';
import { getMimeType } from './utils/mime-types';
import { ConfigurableFilesInterceptor } from '../../common/interceptors/configurable-files.interceptor';
import { serveStaticFile } from '../../utils/file-serve.util';

@ApiTags('文件管理')
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly service: FilesService,
    private readonly imageProcessor: ImageProcessorService,
  ) {}

  @Get(':rootId/categories')
  @ApiOperation({ summary: '获取指定根目录下的分类列表' })
  @ApiParam({ name: 'rootId', description: '根目录 ID' })
  async listCategories(@Param('rootId') rootId: string) {
    return await this.service.listCategories(rootId);
  }

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
  @UseInterceptors(ConfigurableFilesInterceptor)
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
      const mimeType = getMimeType(filename);

      if (mimeType.startsWith('image/') && (w || h || q || format)) {
        await this.serveProcessedImage(fullPath, w, h, q, format, res);
        return;
      }

      await serveStaticFile(fullPath, filename, req, res, {
        download: isDownload,
      });
    } catch {
      throw new NotFoundException('File not found');
    }
  }

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

    const { buffer, mimeType } = await this.imageProcessor.processImage(
      fullPath,
      width,
      height,
      quality,
      outputFormat,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  }

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
