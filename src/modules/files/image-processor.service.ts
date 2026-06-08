/**
 * 图片处理服务
 * 提供图片缩放、格式转换和缓存功能
 * 使用 sharp 库进行图片处理，支持自动缓存处理结果
 */

import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ensureDir, pathExists, readFile, writeFile } from 'fs-extra';
import { resolve } from 'path';
import sharp, { Sharp } from 'sharp';
import { fileConfig } from '../../config/file.config';
import { getMimeTypeForFormat } from './utils/mime-types';

@Injectable()
export class ImageProcessorService {
  /** 缓存目录路径 */
  private readonly cacheDir: string;

  constructor() {
    this.cacheDir = resolve(fileConfig.root, '.cache', 'thumbnails');
  }

  /**
   * 处理图片并返回处理后的结果
   * 支持图片缩放、格式转换和质量调整
   * 自动缓存处理结果以提高性能
   *
   * @param sourcePath 源图片路径
   * @param width 目标宽度（可选）
   * @param height 目标高度（可选）
   * @param quality 图片质量（1-100，默认 80）
   * @param format 输出格式（webp/jpeg/png，默认 webp）
   * @returns 包含处理后图片 buffer 和 MIME 类型的对象
   */
  async processImage(
    sourcePath: string,
    width?: number,
    height?: number,
    quality: number = 80,
    format: string = 'webp',
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    // 生成缓存键，基于输入参数的哈希值
    const cacheKey = this.generateCacheKey(
      sourcePath,
      width,
      height,
      quality,
      format,
    );
    const cachedPath = resolve(this.cacheDir, `${cacheKey}.${format}`);

    // 检查缓存是否存在
    if (await pathExists(cachedPath)) {
      const buffer = await readFile(cachedPath);
      return { buffer, mimeType: getMimeTypeForFormat(format) };
    }

    // 创建 sharp 处理管道
    let pipeline = sharp(sourcePath);

    // 如果指定了宽度或高度，调整图片尺寸
    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit: 'cover' });
    }

    // 根据输出格式设置对应的编码参数
    pipeline = this.applyFormatAndQuality(pipeline, format, quality);

    // 执行处理并获取 buffer
    const buffer = await pipeline.toBuffer();

    // 保存到缓存
    await ensureDir(this.cacheDir);
    await writeFile(cachedPath, buffer);

    return { buffer, mimeType: getMimeTypeForFormat(format) };
  }

  /**
   * 生成缓存键
   * 根据输入参数生成唯一的哈希值作为缓存文件名
   *
   * @param path 源文件路径
   * @param width 目标宽度
   * @param height 目标高度
   * @param quality 图片质量
   * @param format 输出格式
   * @returns SHA-1 哈希字符串
   */
  private generateCacheKey(
    path: string,
    width?: number,
    height?: number,
    quality?: number,
    format?: string,
  ): string {
    return createHash('sha1')
      .update(
        `${path}|${width || ''}|${height || ''}|${quality || ''}|${format || ''}`,
      )
      .digest('hex');
  }

  /**
   * 根据格式和质量设置 sharp 管道参数
   *
   * @param pipeline sharp 处理管道
   * @param format 输出格式
   * @param quality 图片质量
   * @returns 配置后的 sharp 管道
   */
  private applyFormatAndQuality(
    pipeline: Sharp,
    format: string,
    quality: number,
  ) {
    switch (format.toLowerCase()) {
      case 'webp':
        return pipeline.webp({ quality });
      case 'jpeg':
      case 'jpg':
        return pipeline.jpeg({ quality });
      case 'png':
        // PNG 质量范围为 1-10，需要转换
        return pipeline.png({ quality: Math.round(quality / 10) });
      default:
        return pipeline.webp({ quality });
    }
  }
}
