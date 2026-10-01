import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { access, constants } from 'node:fs/promises';
import { ShareLinkEntity } from '#/infra/database/entities/share-link.entity.js';
import { ImageProcessorService } from './image-processor.service.js';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly imageProcessor: ImageProcessorService,
    @InjectRepository(ShareLinkEntity)
    private readonly shareRepo: Repository<ShareLinkEntity>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runDailyCleanup() {
    this.logger.log('Starting daily cleanup...');
    await this.cleanupThumbnails();
    await this.cleanupExpiredShares();
    this.logger.log('Daily cleanup finished');
  }

  /** 清理缩略图缓存：删除源文件已不存在的缓存文件 */
  private async cleanupThumbnails() {
    const manifest = await this.imageProcessor.getManifest();
    const orphans: string[] = [];

    for (const [cacheFile, info] of Object.entries(manifest)) {
      try {
        await access(info.sourcePath, constants.F_OK);
      } catch {
        orphans.push(cacheFile);
      }
    }

    if (orphans.length > 0) {
      await this.imageProcessor.removeCacheEntries(orphans);
      this.logger.log(
        `Cleaned ${orphans.length} orphaned thumbnail cache entries`,
      );
    } else {
      this.logger.log('No orphaned thumbnail cache entries found');
    }
  }

  /** 清理过期分享链接 */
  private async cleanupExpiredShares() {
    const now = Date.now();
    const result = await this.shareRepo
      .createQueryBuilder()
      .delete()
      .where([{ expiresAt: LessThan(now) }])
      .orWhere('maxAccesses IS NOT NULL AND accessCount >= maxAccesses')
      .execute();

    const deleted = result.affected ?? 0;
    this.logger.log(`Cleaned ${deleted} expired share links`);
  }
}
