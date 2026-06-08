/**
 * 图片服务
 * 负责图片的缓存、随机获取和处理（如缩略图生成）
 * 直接扫描文件系统，支持多根目录和分类维度的图片管理
 */

import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { existsSync } from 'fs';
import { readdir } from 'fs-extra';
import { extname, join } from 'path';
import { scheduleConfig } from '../../config/schedule.config';
import { ResourceRootsService } from '../../infra/resource-roots/resource-roots.service';
import { ImageProcessorService } from '../files/image-processor.service';
import { fileConfig } from '../../config/file.config';

/**
 * 图片服务
 * 负责图片的缓存、随机获取和处理（如缩略图生成）
 * 直接扫描文件系统，支持多根目录和分类维度的图片管理
 *
 * 优化说明：
 * - 复用 ImageProcessorService 处理图片缩放和缓存
 * - 复用 mime-types.ts 的 MIME 类型映射
 * - 移除重复的 sharp 调用和缓存逻辑
 */
@Injectable()
export class PhotoService implements OnModuleInit {
  private readonly logger = new Logger(PhotoService.name);
  private readonly imageExtensions = new Set(
    fileConfig.imageExtensions.map((e) => e.toLowerCase()),
  );

  // 缓存结构
  private imageCache: Map<string, string[]> = new Map(); // 分类 -> 图片路径列表 (全局)
  private rootImageCache: Map<string, string[]> = new Map(); // 根目录ID -> 图片路径列表
  private rootCategoryCache: Map<string, string[]> = new Map(); // 根目录ID:分类 -> 图片路径列表
  private allImages: string[] = []; // 所有图片路径

  private refreshTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly resourceService: ResourceRootsService,
    private readonly imageProcessor: ImageProcessorService,
  ) {}

  /**
   * 模块初始化时刷新图片缓存
   */
  async onModuleInit() {
    await this.refreshImageCache();
  }

  /**
   * 刷新图片缓存
   * 直接遍历文件系统建立索引，解耦数据库依赖
   *
   * 缓存策略：
   * - 遍历每个根目录下的第一级子目录作为分类
   * - 每个分类下的所有图片（包括子目录中）都归为此分类
   */
  async refreshImageCache() {
    this.logger.log('开始图像缓存刷新...');
    const start = Date.now();

    // 清空缓存
    this.imageCache.clear();
    this.rootImageCache.clear();
    this.rootCategoryCache.clear();
    this.allImages = [];

    const roots = this.resourceService.getRoots();

    for (const root of roots) {
      try {
        const rootPath = this.resourceService.resolveRootPath(root.id);
        const rootImages: string[] = [];

        // 读取根目录下的文件夹作为分类
        const entries = await readdir(rootPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const category = entry.name;
            const categoryPath = join(rootPath, category);

            // 递归扫描该分类下的所有图片
            const images = await this.scanImagesRecursively(categoryPath);

            if (images.length > 0) {
              // 1. 更新 根目录:分类 缓存
              const rootCatKey = `${root.id}:${category}`;
              this.rootCategoryCache.set(rootCatKey, images);

              // 2. 更新 全局分类 缓存
              const existing = this.imageCache.get(category) || [];
              this.imageCache.set(category, [...existing, ...images]);

              // 3. 收集到当前根目录列表
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

    // 随机打乱所有缓存
    this.shuffleCache(this.imageCache);
    this.shuffleCache(this.rootImageCache);
    this.shuffleCache(this.rootCategoryCache);
    this.allImages = this.shuffle(this.allImages);

    this.logger.log(
      `缓存刷新完成，耗时 ${Date.now() - start}ms. 总图片数: ${this.allImages.length}`,
    );
  }

  /**
   * 递归扫描目录下的所有图片
   *
   * @param dir 目录路径
   * @returns 图片文件路径列表
   */
  private async scanImagesRecursively(dir: string): Promise<string[]> {
    const results: string[] = [];
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // 忽略隐藏目录
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await this.scanImagesRecursively(fullPath)));
        } else if (entry.isFile() && this.isImage(entry.name)) {
          results.push(fullPath);
        }
      }
    } catch {
      // 忽略访问错误
    }
    return results;
  }

  /**
   * 定时任务：自动刷新缓存
   */
  @Interval(scheduleConfig.cacheRefreshInterval)
  async handleCacheRefresh() {
    await this.refreshImageCache();
  }

  /**
   * 监听资源更新事件
   */
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

  /**
   * 辅助方法：打乱 Map 中的数组
   *
   * @param map 要打乱的 Map
   */
  private shuffleCache(map: Map<string, string[]>) {
    for (const [key, val] of map) {
      map.set(key, this.shuffle(val));
    }
  }

  /**
   * Fisher-Yates 洗牌算法
   *
   * @param array 要打乱的数组
   * @returns 打乱后的数组
   */
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 检查文件是否为图片
   *
   * @param filename 文件名
   * @returns 是否为图片
   */
  private isImage(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.imageExtensions.has(ext);
  }

  /**
   * 获取随机图片路径
   *
   * @param category 分类名称（可选）
   * @param rootId 根目录 ID（可选）
   * @returns 随机图片路径
   * @throws NotFoundException 如果没有找到图片
   */
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

    // 随机选择
    const randomPath = images[Math.floor(Math.random() * images.length)];
    return Promise.resolve(randomPath);
  }

  /**
   * 获取处理后的图片（原图或缩略图）
   * 复用 ImageProcessorService 处理图片缩放和缓存
   *
   * @param category 分类名称（可选）
   * @param width 目标宽度（可选）
   * @param height 目标高度（可选）
   * @param rootId 根目录 ID（可选）
   * @returns 包含 buffer 和 MIME 类型的对象
   * @throws NotFoundException 如果文件不存在
   */
  async getProcessedImage(
    category: string | undefined,
    width?: number,
    height?: number,
    rootId?: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const imagePath = await this.getRandomImage(category, rootId);

    if (!existsSync(imagePath)) {
      throw new NotFoundException('文件不存在');
    }

    // 如果不需要缩放，直接返回原图
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

    // 需要缩放，使用 ImageProcessorService 处理
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
