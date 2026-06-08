import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
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
    @Res() res: Response,
    @Query('width') width?: string,
    @Query('height') height?: string,
    @Query('text') text?: string,
    @Query('bgColor') bgColor?: string,
    @Query('textColor') textColor?: string,
    @Query('fontFamily') fontFamily?: string,
    @Query('fontWeight') fontWeight?: string,
    @Query('fontSize') fontSize?: string,
  ) {
    this.generateAndSendSvg(res, {
      width,
      height,
      text,
      bgColor,
      textColor,
      fontFamily,
      fontWeight,
      fontSize,
    });
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
    @Res() res: Response,
    @Query('text') text?: string,
    @Query('bgColor') bgColor?: string,
    @Query('textColor') textColor?: string,
    @Query('fontFamily') fontFamily?: string,
    @Query('fontWeight') fontWeight?: string,
    @Query('fontSize') fontSize?: string,
  ) {
    this.generateAndSendSvg(res, {
      width: size,
      height: size,
      text,
      bgColor,
      textColor,
      fontFamily,
      fontWeight,
      fontSize,
    });
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
    @Res() res: Response,
    @Query('text') text?: string,
    @Query('bgColor') bgColor?: string,
    @Query('textColor') textColor?: string,
    @Query('fontFamily') fontFamily?: string,
    @Query('fontWeight') fontWeight?: string,
    @Query('fontSize') fontSize?: string,
  ) {
    this.generateAndSendSvg(res, {
      width,
      height,
      text,
      bgColor,
      textColor,
      fontFamily,
      fontWeight,
      fontSize,
    });
  }

  private generateAndSendSvg(res: Response, options: PlaceholderOptions) {
    const svg = this.service.generatePlaceholder(options);
    this.sendSvg(res, svg);
  }

  private sendSvg(res: Response, svg: string) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  }
}
