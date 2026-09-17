import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { access } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { ResourceRootsService } from '../../infra/resource-roots/resource-roots.service';
import { ImageProcessorService } from '../files/image-processor.service';

@Injectable()
export class PhotoService implements OnModuleInit {
  private readonly logger = new Logger(PhotoService.name);
  private readonly imageExtensions: Set<string>;
  private readonly syncIntervalName = 'photo-cache-refresh';

  private imageCache: Map<string, string[]> = new Map();
  private rootImageCache: Map<string, string[]> = new Map();
  private rootCategoryCache: Map<string, string[]> = new Map();
  private allImages: string[] = [];

  private refreshTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly resourceService: ResourceRootsService,
    private readonly imageProcessor: ImageProcessorService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    const imageExtensions = this.configService.get<string[]>(
      'files.imageExtensions',
    ) ?? ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff'];
    this.imageExtensions = new Set(imageExtensions.map((e) => e.toLowerCase()));
  }

  async onModuleInit() {
    await this.refreshImageCache();

    const interval =
      this.configService.get<number>('schedule.cacheRefreshInterval') ?? 300000;
    const callback = () => {
      void this.refreshImageCache();
    };
    const intervalId = setInterval(callback, interval);
    this.schedulerRegistry.addInterval(this.syncIntervalName, intervalId);
    this.logger.log(`Photo cache refresh scheduled every ${interval}ms`);
  }

  async refreshImageCache() {
    this.logger.log('开始图像缓存刷新...');
    const start = Date.now();

    this.imageCache.clear();
    this.rootImageCache.clear();
    this.rootCategoryCache.clear();
    this.allImages = [];

    const roots = this.resourceService.getRoots();

    for (const root of roots) {
      try {
        const rootPath = this.resourceService.resolveRootPath(root.id);
        const rootImages: string[] = [];

        const entries = await readdir(rootPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const category = entry.name;
            const categoryPath = join(rootPath, category);

            const images = await this.scanImagesRecursively(categoryPath);

            if (images.length > 0) {
              const rootCatKey = `${root.id}:${category}`;
              this.rootCategoryCache.set(rootCatKey, images);

              const existing = this.imageCache.get(category) || [];
              this.imageCache.set(category, [...existing, ...images]);

              rootImages.push(...images);
            }
          }
        }

        if (rootImages.length > 0) {
          this.rootImageCache.set(root.id, rootImages);
          this.allImages.push(...rootImages);
        }

        this.logger.log(`Root ${root.id}: Found ${rootImages.length} images`);
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(`扫描根目录 ${root.id} 时出错: ${error.message}`);
        }
      }
    }

    this.shuffleCache(this.imageCache);
    this.shuffleCache(this.rootImageCache);
    this.shuffleCache(this.rootCategoryCache);
    this.allImages = this.shuffle(this.allImages);

    this.logger.log(
      `缓存刷新完成，耗时 ${Date.now() - start}ms. 总图片数: ${this.allImages.length}`,
    );
  }

  private async scanImagesRecursively(dir: string): Promise<string[]> {
    const results: string[] = [];
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await this.scanImagesRecursively(fullPath)));
        } else if (entry.isFile() && this.isImage(entry.name)) {
          results.push(fullPath);
        }
      }
    } catch {
      // ignore access errors
    }
    return results;
  }

  @OnEvent('resource.updated')
  handleResourceUpdate() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.refreshTimeout = setTimeout(() => {
      void this.refreshImageCache().then(() => {
        this.refreshTimeout = null;
      });
    }, 2000);
  }

  @OnEvent('files.index.resynced')
  handleFileIndexResynced() {
    void this.refreshImageCache();
  }

  private shuffleCache(map: Map<string, string[]>) {
    for (const [key, val] of map) {
      map.set(key, this.shuffle(val));
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private isImage(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.imageExtensions.has(ext);
  }

  async getRandomImage(category?: string, rootId?: string): Promise<string> {
    let images: string[] | undefined;

    if (rootId && category) {
      images = this.rootCategoryCache.get(`${rootId}:${category}`);
    } else if (rootId) {
      images = this.rootImageCache.get(rootId);
    } else if (category) {
      images = this.imageCache.get(category);
    } else {
      if (this.allImages.length === 0) {
        throw new NotFoundException('没有找到图像');
      }
      images = this.allImages;
    }

    if (!images || images.length === 0) {
      const msg = [
        rootId ? `Root: ${rootId}` : '',
        category ? `Category: ${category}` : '',
      ]
        .filter(Boolean)
        .join(', ');
      throw new NotFoundException(`在该条件下没有找到图像 (${msg})`);
    }

    const randomPath = images[Math.floor(Math.random() * images.length)];
    return Promise.resolve(randomPath);
  }

  async getProcessedImage(
    category: string | undefined,
    width?: number,
    height?: number,
    rootId?: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const imagePath = await this.getRandomImage(category, rootId);

    try {
      await access(imagePath);
    } catch {
      throw new NotFoundException('文件不存在');
    }

    if (!width || !height) {
      const { buffer, mimeType } = await this.imageProcessor.processImage(
        imagePath,
        undefined,
        undefined,
        80,
        extname(imagePath).replace('.', ''),
      );
      return { buffer, mimeType };
    }

    const { buffer } = await this.imageProcessor.processImage(
      imagePath,
      width,
      height,
      80,
      'webp',
    );

    return { buffer, mimeType: 'image/webp' };
  }
}
