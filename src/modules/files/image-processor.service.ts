import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { mkdir, access, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import sharp, { Sharp } from 'sharp';
import { getMimeTypeForFormat } from './utils/mime-types';

@Injectable()
export class ImageProcessorService {
  private readonly cacheDir: string;

  constructor(private readonly configService: ConfigService) {
    const fileRoot =
      this.configService.get<string>('files.root') ?? 'resources';
    this.cacheDir = resolve(fileRoot, '.cache', 'thumbnails');
  }

  async processImage(
    sourcePath: string,
    width?: number,
    height?: number,
    quality: number = 80,
    format: string = 'webp',
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const cacheKey = this.generateCacheKey(
      sourcePath,
      width,
      height,
      quality,
      format,
    );
    const cachedPath = resolve(this.cacheDir, `${cacheKey}.${format}`);

    try {
      await access(cachedPath);
      const buffer = await readFile(cachedPath);
      return { buffer, mimeType: getMimeTypeForFormat(format) };
    } catch {
      // Cache miss, process image
    }

    let pipeline = sharp(sourcePath);

    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit: 'cover' });
    }

    pipeline = this.applyFormatAndQuality(pipeline, format, quality);

    const buffer = await pipeline.toBuffer();

    await mkdir(dirname(cachedPath), { recursive: true });
    await writeFile(cachedPath, buffer);

    return { buffer, mimeType: getMimeTypeForFormat(format) };
  }

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
        return pipeline.png({ quality: Math.round(quality / 10) });
      default:
        return pipeline.webp({ quality });
    }
  }
}
