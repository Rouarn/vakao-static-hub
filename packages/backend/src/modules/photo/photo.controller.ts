import {
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { PhotoService } from './photo.service';

@ApiTags('图片服务')
@Controller('photo')
export class PhotoController {
  constructor(private readonly service: PhotoService) {}

  @Post('refresh-cache')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '刷新图片缓存' })
  async refreshCache() {
    await this.service.refreshImageCache();
    return { message: 'ok' };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: '获取随机图片' })
  @ApiQuery({ name: 'rootId', required: false, description: '资源根目录 ID' })
  @ApiQuery({ name: 'category', required: false, description: '分类名称' })
  @ApiQuery({ name: 'width', required: false, description: '图片宽度' })
  @ApiQuery({ name: 'height', required: false, description: '图片高度' })
  async getRandomImage(
    @Query('rootId') rootId: string | undefined,
    @Query('category') category: string | undefined,
    @Query('width') width: string | undefined,
    @Query('height') height: string | undefined,
    @Res() res: Response,
  ) {
    const widthNum = width ? Number(width) : undefined;
    const heightNum = height ? Number(height) : undefined;

    if ((width && isNaN(widthNum!)) || (height && isNaN(heightNum!))) {
      throw new BadRequestException('宽度和高度必须是数字');
    }

    const { buffer, mimeType } = await this.service.getProcessedImage(
      category,
      widthNum,
      heightNum,
      rootId,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(buffer);
  }
}
