/**
 * 图片服务控制器
 * 提供随机图片的 HTTP 接口，支持按尺寸、分类和根目录筛选
 *
 * 优化说明：
 * - 简化路由逻辑，提高可读性
 * - 统一错误处理方式
 * - 图片获取接口公开访问，刷新缓存接口需要认证
 */

import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { PhotoService } from './photo.service';

/**
 * 图片服务控制器类
 * 处理随机图片相关的 HTTP 请求
 */
@ApiTags('图片服务')
@Controller('photo')
export class PhotoController {
  constructor(private readonly service: PhotoService) {}

  /**
   * 刷新图片缓存
   * 触发后台重新扫描目录并构建索引
   * 需要认证
   *
   * @returns 操作结果
   */
  @Post('refresh-cache')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '刷新图片缓存' })
  async refreshCache() {
    await this.service.refreshImageCache();
    return { message: 'ok' };
  }

  /**
   * 获取所有资源库中的随机图片
   * 路由: /photo
   * 公开访问
   *
   * @param res HTTP 响应对象
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '获取随机图片（所有资源库）' })
  async randomGlobal(@Res() res: Response) {
    const { buffer, mimeType } = await this.service.getProcessedImage(
      undefined,
      undefined,
      undefined,
      undefined,
    );
    this.sendImage(res, buffer, mimeType);
  }

  /**
   * 获取随机图片（支持尺寸或资源库+分类）
   * 路由: /photo/:p1/:p2
   * 公开访问
   *
   * 参数说明：
   * - p1, p2 都是数字：返回指定尺寸的随机图片（所有资源库）
   * - p1 是字符串，p2 是字符串：返回指定资源库+分类的随机图片
   *
   * @param p1 第一个路径参数（宽度或根目录 ID）
   * @param p2 第二个路径参数（高度或分类名称）
   * @param res HTTP 响应对象
   */
  @Public()
  @Get(':p1/:p2')
  @ApiOperation({ summary: '获取随机图片 (指定尺寸 或 指定资源库+分类)' })
  @ApiParam({
    name: 'p1',
    description: '宽度 (数字) 或 资源根目录 ID (字符串)',
  })
  @ApiParam({ name: 'p2', description: '高度 (数字) 或 分类名称 (字符串)' })
  async randomTwoParams(
    @Param('p1') p1: string,
    @Param('p2') p2: string,
    @Res() res: Response,
  ) {
    const p1Num = Number(p1);
    const p2Num = Number(p2);
    const isSize = !isNaN(p1Num) && !isNaN(p2Num);

    if (isSize) {
      // 场景1：获取所有资源库中的随机指定宽高图片
      const { buffer, mimeType } = await this.service.getProcessedImage(
        undefined,
        p1Num,
        p2Num,
        undefined,
      );
      this.sendImage(res, buffer, mimeType);
    } else {
      // 场景2：获取指定资源库和分类的随机图片
      const { buffer, mimeType } = await this.service.getProcessedImage(
        p2, // category
        undefined,
        undefined,
        p1, // rootId
      );
      this.sendImage(res, buffer, mimeType);
    }
  }

  /**
   * 获取指定资源库和尺寸的随机图片
   * 路由: /photo/{rootId}/{width}/{height}
   * 公开访问
   *
   * @param rootId 资源根目录 ID
   * @param width 图片宽度
   * @param height 图片高度
   * @param res HTTP 响应对象
   */
  @Public()
  @Get(':rootId/:width/:height')
  @ApiOperation({ summary: '获取指定资源库和尺寸的随机图片' })
  @ApiParam({ name: 'rootId', description: '资源根目录 ID' })
  @ApiParam({ name: 'width', description: '宽度 (数字)' })
  @ApiParam({ name: 'height', description: '高度 (数字)' })
  async randomRootSize(
    @Param('rootId') rootId: string,
    @Param('width') width: string,
    @Param('height') height: string,
    @Res() res: Response,
  ) {
    const widthNum = Number(width);
    const heightNum = Number(height);
    if (isNaN(widthNum) || isNaN(heightNum)) {
      throw new BadRequestException('宽度和高度必须是数字');
    }

    const { buffer, mimeType } = await this.service.getProcessedImage(
      undefined,
      widthNum,
      heightNum,
      rootId,
    );
    this.sendImage(res, buffer, mimeType);
  }

  /**
   * 获取指定资源库、分类和尺寸的随机图片
   * 路由: /photo/{rootId}/{category}/{width}/{height}
   * 公开访问
   *
   * @param rootId 资源根目录 ID
   * @param category 分类名称
   * @param width 图片宽度
   * @param height 图片高度
   * @param res HTTP 响应对象
   */
  @Public()
  @Get(':rootId/:category/:width/:height')
  @ApiOperation({ summary: '获取指定资源库、分类和尺寸的随机图片' })
  @ApiParam({ name: 'rootId', description: '资源根目录 ID' })
  @ApiParam({ name: 'category', description: '分类名称' })
  @ApiParam({ name: 'width', description: '宽度 (数字)' })
  @ApiParam({ name: 'height', description: '高度 (数字)' })
  async randomRootCategorySize(
    @Param('rootId') rootId: string,
    @Param('category') category: string,
    @Param('width') width: string,
    @Param('height') height: string,
    @Res() res: Response,
  ) {
    const widthNum = Number(width);
    const heightNum = Number(height);
    if (isNaN(widthNum) || isNaN(heightNum)) {
      throw new BadRequestException('宽度和高度必须是数字');
    }

    const { buffer, mimeType } = await this.service.getProcessedImage(
      category,
      widthNum,
      heightNum,
      rootId,
    );
    this.sendImage(res, buffer, mimeType);
  }

  /**
   * 获取指定资源库的随机图片
   * 路由: /photo/{rootId}
   * 公开访问
   *
   * @param rootId 资源根目录 ID
   * @param res HTTP 响应对象
   */
  @Public()
  @Get(':rootId')
  @ApiOperation({ summary: '获取指定资源库的随机图片' })
  @ApiParam({ name: 'rootId', description: '资源根目录 ID' })
  async randomRoot(@Param('rootId') rootId: string, @Res() res: Response) {
    const { buffer, mimeType } = await this.service.getProcessedImage(
      undefined,
      undefined,
      undefined,
      rootId,
    );
    this.sendImage(res, buffer, mimeType);
  }

  /**
   * 发送图片响应
   * 设置禁止缓存的响应头，确保每次请求都重新获取
   *
   * @param res HTTP 响应对象
   * @param buffer 图片数据
   * @param MIME MIME 类型
   */
  private sendImage(res: Response, buffer: Buffer, mimeType: string) {
    res.setHeader('Content-Type', mimeType);
    // 禁止浏览器和代理缓存随机图片接口的响应，确保每次请求都重新获取
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(buffer);
  }
}
