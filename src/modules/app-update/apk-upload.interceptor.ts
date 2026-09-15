/**
 * APK 上传拦截器
 *
 * 为什么不复用 ConfigurableFilesInterceptor：
 * 其底层 FilesInterceptor 未配置 storage，multer 默认 memory storage，
 * 数百 MB 的 APK 会整体驻留内存。此处改用 diskStorage 落盘临时文件，
 * 后续由 Service 流式计算 SHA-256 并归档，全程不占用大块内存。
 */

import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/** APK 上传临时目录（位于 apk 根下，与最终归档同盘，便于原子改名/流式写入） */
export const APK_TMP_DIR = join(process.cwd(), 'apk', '.apk-tmp');

/** 单包大小上限 500MB */
export const APK_MAX_SIZE = 500 * 1024 * 1024;

/**
 * APK 上传拦截器工厂
 * 字段名固定为 file，仅接受 .apk 扩展名
 */
export function ApkUploadInterceptor() {
  return FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        try {
          mkdirSync(APK_TMP_DIR, { recursive: true });
          cb(null, APK_TMP_DIR);
        } catch (e) {
          cb(e as Error, '');
        }
      },
      filename: (_req, _file, cb) => {
        // 统一命名避免客户端文件名中的非法字符/路径穿越
        cb(null, `${randomUUID()}.apk`);
      },
    }),
    limits: { fileSize: APK_MAX_SIZE, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!file.originalname.toLowerCase().endsWith('.apk')) {
        cb(new BadRequestException('仅支持上传 .apk 安装包'), false);
        return;
      }
      cb(null, true);
    },
  });
}
