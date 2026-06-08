/**
 * 文件配置
 * 定义文件存储和处理的配置参数
 */

import { registerAs } from '@nestjs/config';
import { join } from 'path';

/**
 * 文件配置对象
 * 包含文件根目录、上传限制和支持的图片格式等
 */
export const fileConfig = {
  root: process.env.FILE_ROOT
    ? join(process.env.FILE_ROOT)
    : join(process.cwd(), 'resources'),
  maxCount: Number(process.env.UPLOAD_MAX_COUNT ?? 20),
  defaultCategory: process.env.DEFAULT_CATEGORY ?? 'TemporaryFile',
  imageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff'], // 支持的图片文件扩展名
};

export const fileConfigFactory = registerAs('files', () => fileConfig);
