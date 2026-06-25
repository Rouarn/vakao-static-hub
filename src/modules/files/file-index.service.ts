/**
 * 文件索引服务
 * 负责文件系统的物理文件与数据库索引之间的同步
 * 包含定时全量同步和事件触发的增量更新
 */

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { ensureDir, readdir, stat } from 'fs-extra';
import { extname, join, resolve } from 'path';
import { In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { scheduleConfig } from '../../config/schedule.config';
import { ResourceRootsService } from '../../infra/resource-roots/resource-roots.service';
import { FileEntryEntity } from '../../infra/database/entities/file-entry.entity';

type FileRecord = Omit<FileEntryEntity, 'id'>;

/**
 * 文件索引服务
 * 负责文件系统的物理文件与数据库索引之间的同步
 * 包含定时全量同步和事件触发的增量更新
 */
@Injectable()
export class FileIndexService implements OnApplicationBootstrap {
  constructor(
    private readonly resourceRoots: ResourceRootsService,
    @InjectRepository(FileEntryEntity)
    private readonly repo: Repository<FileEntryEntity>,
  ) {}

  /**
   * 应用启动时执行一次全量同步
   */
  async onApplicationBootstrap() {
    await this.syncAll();
  }

  /**
   * 定时任务：定期全量同步所有资源根目录
   * 间隔时间由配置决定
   */
  @Interval(scheduleConfig.cacheRefreshInterval)
  async syncAll() {
    const roots = this.resourceRoots.getRoots();

    // Cleanup orphaned data
    const activeRootIds = roots.map((r) => r.id);
    if (activeRootIds.length > 0) {
      await this.repo.delete({ rootId: Not(In(activeRootIds)) });
    } else {
      await this.repo.clear();
    }

    for (const root of roots) {
      await this.syncRoot(root.id);
    }
  }

  /**
   * 监听资源配置更新事件，触发全量同步
   */
  @OnEvent('resource.updated')
  async handleResourceUpdated() {
    await this.syncAll();
  }

  /**
   * 同步指定根目录下的所有文件索引
   * 策略：清空该根目录下的旧索引，重新扫描并插入
   * @param rootId 根目录 ID
   */
  async syncRoot(rootId: string) {
    const rootPath = this.resourceRoots.resolveRootPath(rootId);
    await ensureDir(rootPath);
    const categories = (await readdir(rootPath, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name);

    // 清理旧数据
    await this.repo.delete({ rootId });

    for (const category of categories) {
      const categoryPath = resolve(rootPath, category);
      const records = await this.walkCategory(rootId, category, categoryPath);
      await this.insertInBatches(records);
    }
  }

  /**
   * 批量插入文件记录，避免一次性插入过多导致数据库报错
   */
  private async insertInBatches(records: FileRecord[]) {
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      if (batch.length > 0) {
        await this.repo.upsert(batch, ['rootId', 'category', 'relPath']);
      }
    }
  }

  /**
   * 递归遍历分类目录，收集文件信息
   * @param rootId 根目录 ID
   * @param category 分类名
   * @param dir 当前物理路径
   * @param relBase 相对路径基准
   */
  private async walkCategory(
    rootId: string,
    category: string,
    dir: string,
    relBase = '',
  ): Promise<FileRecord[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const results: FileRecord[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // 忽略隐藏目录
      const absPath = join(dir, entry.name);
      const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        results.push(
          ...(await this.walkCategory(rootId, category, absPath, relPath)),
        );
        continue;
      }
      if (!entry.isFile()) continue;

      const s = await stat(absPath);
      const ext = extname(entry.name).toLowerCase();
      results.push({
        rootId,
        category,
        relPath,
        name: entry.name,
        ext,
        size: s.size,
        mtimeMs: s.mtimeMs,
      });
    }

    return results;
  }

  /**
   * 更新单个文件的索引
   */
  async upsertOne(rootId: string, category: string, relPath: string) {
    const rootPath = this.resourceRoots.resolveRootPath(rootId);
    const absPath = resolve(rootPath, category, ...relPath.split('/'));
    const s = await stat(absPath);
    const name = relPath.split('/').pop() ?? relPath;
    const ext = extname(name).toLowerCase();

    await this.repo.upsert(
      {
        rootId,
        category,
        relPath,
        name,
        ext,
        size: s.size,
        mtimeMs: s.mtimeMs,
      },
      ['rootId', 'category', 'relPath'],
    );
  }

  /**
   * 批量移除文件索引
   */
  async removeMany(rootId: string, category: string, relPaths: string[]) {
    const rows = await this.repo.find({
      where: { rootId, category, relPath: In(relPaths) },
      select: { id: true },
    });
    if (rows.length === 0) return;
    await this.repo.delete(rows.map((r) => r.id));
  }
}
