import {
  Controller,
  Get,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator.js';
import { PhotoService } from './photo.service.js';

@ApiTags('图片服务')
@Controller('photo')
export class PhotoController {
  constructor(private readonly service: PhotoService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '获取随机图片' })
  @ApiQuery({ name: 'rootId', required: false, description: '资源根目录 ID' })
  @ApiQuery({ name: 'category', required: false, description: '分类名称' })
  @ApiQuery({ name: 'width', required: false, description: '图片宽度' })
  @ApiQuery({ name: 'height', required: false, description: '图片高度' })
  @ApiQuery({
    name: 'r',
    required: false,
    description: '资源根目录 ID（rootId 简称，同时存在时优先 rootId）',
  })
  @ApiQuery({
    name: 'c',
    required: false,
    description: '分类名称（category 简称，同时存在时优先 category）',
  })
  @ApiQuery({
    name: 'w',
    required: false,
    description: '图片宽度（width 简称，同时存在时优先 width）',
  })
  @ApiQuery({
    name: 'h',
    required: false,
    description: '图片高度（height 简称，同时存在时优先 height）',
  })
  async getRandomImage(
    @Query('rootId') rootId: string | undefined,
    @Query('category') category: string | undefined,
    @Query('width') width: string | undefined,
    @Query('height') height: string | undefined,
    @Query('r') r: string | undefined,
    @Query('c') c: string | undefined,
    @Query('w') w: string | undefined,
    @Query('h') h: string | undefined,
    @Res() res: Response,
  ) {
    // 全称优先于简称
    const effectiveRootId = rootId ?? r;
    const effectiveCategory = category ?? c;
    const effectiveWidth = width ?? w;
    const effectiveHeight = height ?? h;

    const widthNum = effectiveWidth ? Number(effectiveWidth) : undefined;
    const heightNum = effectiveHeight ? Number(effectiveHeight) : undefined;

    if (
      (effectiveWidth && isNaN(widthNum!)) ||
      (effectiveHeight && isNaN(heightNum!))
    ) {
      throw new BadRequestException('宽度和高度必须是数字');
    }

    const { buffer, mimeType } = await this.service.getProcessedImage(
      effectiveCategory,
      widthNum,
      heightNum,
      effectiveRootId,
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
