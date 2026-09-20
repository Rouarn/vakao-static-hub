import { registerAs } from '@nestjs/config';
import { join } from 'path';

export interface FileConfig {
  root: string;
  maxCount: number;
  defaultCategory: string;
  imageExtensions: string[];
}

export const fileConfigFactory = registerAs('files', (): FileConfig => ({
  root: process.env.FILE_ROOT
    ? join(process.env.FILE_ROOT)
    : join(process.cwd(), 'storage') || '',
  maxCount: Number(process.env.UPLOAD_MAX_COUNT ?? 20),
  defaultCategory: process.env.DEFAULT_CATEGORY ?? 'TemporaryFile',
  imageExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff'],
}));
