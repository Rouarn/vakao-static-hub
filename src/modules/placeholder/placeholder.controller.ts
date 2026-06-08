import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { createHash } from 'crypto';
import { PlaceholderService, PlaceholderOptions } from './placeholder.service';

@ApiTags('占位图服务')
@Controller('placeholder')
export class PlaceholderController {
  constructor(private readonly service: PlaceholderService) {}

  @Get()
  @ApiOperation({ summary: '获取默认占位图 (300x150)，支持查询参数自定义' })
  @ApiQuery({ name: 'width', required: false, description: '宽度' })
  @ApiQuery({ name: 'height', required: false, description: '高度' })
  @ApiQuery({ name: 'text', required: false, description: '显示的文字' })
  @ApiQuery({ name: 'bgColor', required: false, description: '背景颜色' })
  @ApiQuery({ name: 'textColor', required: false, description: '文字颜色' })
  @ApiQuery({ name: 'fontFamily', required: false, description: '字体' })
  @ApiQuery({ name: 'fontWeight', required: false, description: '字重' })
  @ApiQuery({ name: 'fontSize', required: false, description: '字体大小' })
  getDefaultPlaceholder(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: Record<string, string>,
  ) {
    const base = this.extractQueryOptions(query);
    this.generateAndSendSvg(req, res, base);
  }

  @Get(':size')
  @ApiOperation({
    summary: '获取指定尺寸的占位图 (正方形)，支持查询参数自定义',
  })
  @ApiParam({ name: 'size', description: '正方形尺寸 (例如: 200)' })
  @ApiQuery({ name: 'text', required: false, description: '显示的文字' })
  @ApiQuery({ name: 'bgColor', required: false, description: '背景颜色' })
  @ApiQuery({ name: 'textColor', required: false, description: '文字颜色' })
  @ApiQuery({ name: 'fontFamily', required: false, description: '字体' })
  @ApiQuery({ name: 'fontWeight', required: false, description: '字重' })
  @ApiQuery({ name: 'fontSize', required: false, description: '字体大小' })
  getSquarePlaceholder(
    @Param('size') size: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: Record<string, string>,
  ) {
    const base = this.extractQueryOptions(query);
    this.generateAndSendSvg(req, res, { ...base, width: size, height: size });
  }

  @Get(':width/:height')
  @ApiOperation({ summary: '获取指定宽高的占位图，支持查询参数自定义' })
  @ApiParam({ name: 'width', description: '宽度' })
  @ApiParam({ name: 'height', description: '高度' })
  @ApiQuery({ name: 'text', required: false, description: '显示的文字' })
  @ApiQuery({ name: 'bgColor', required: false, description: '背景颜色' })
  @ApiQuery({ name: 'textColor', required: false, description: '文字颜色' })
  @ApiQuery({ name: 'fontFamily', required: false, description: '字体' })
  @ApiQuery({ name: 'fontWeight', required: false, description: '字重' })
  @ApiQuery({ name: 'fontSize', required: false, description: '字体大小' })
  getCustomSizePlaceholder(
    @Param('width') width: string,
    @Param('height') height: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: Record<string, string>,
  ) {
    const base = this.extractQueryOptions(query);
    this.generateAndSendSvg(req, res, { ...base, width, height });
  }

  private extractQueryOptions(
    query: Record<string, string>,
  ): PlaceholderOptions {
    return {
      width: query.width,
      height: query.height,
      text: query.text,
      bgColor: query.bgColor,
      textColor: query.textColor,
      fontFamily: query.fontFamily,
      fontWeight: query.fontWeight,
      fontSize: query.fontSize,
    };
  }

  private generateAndSendSvg(
    req: Request,
    res: Response,
    options: PlaceholderOptions,
  ) {
    const svg = this.service.generatePlaceholder(options);

    const etag = createHash('md5').update(svg).digest('hex');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('ETag', `"${etag}"`);

    if (req.headers['if-none-match'] === `"${etag}"`) {
      res.status(304).end();
      return;
    }

    res.send(svg);
  }
}
