import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ResourceRootsService } from '../../infra/resource-roots/resource-roots.service.js';
import { FileEntryEntity } from '../../infra/database/entities/file-entry.entity.js';

type FileRecord = Omit<FileEntryEntity, 'id'>;

@Injectable()
export class FileIndexService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FileIndexService.name);
  private readonly syncIntervalName = 'file-index-sync';

  constructor(
    private readonly resourceRoots: ResourceRootsService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectRepository(FileEntryEntity)
    private readonly repo: Repository<FileEntryEntity>,
  ) {}

  async onApplicationBootstrap() {
    await this.syncAll();

    const interval =
      this.configService.get<number>('schedule.cacheRefreshInterval') ?? 300000;
    const callback = () => {
      void this.syncAll();
    };
    const intervalId = setInterval(callback, interval);
    this.schedulerRegistry.addInterval(this.syncIntervalName, intervalId);
    this.logger.log(`File index sync scheduled every ${interval}ms`);
  }

  async syncAll() {
    const roots = this.resourceRoots.getRoots();

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

  @OnEvent('resource.updated')
  async handleResourceUpdated() {
    await this.syncAll();
  }

  async syncRoot(rootId: string) {
    const rootPath = this.resourceRoots.resolveRootPath(rootId);
    await mkdir(rootPath, { recursive: true });
    const categories = (await readdir(rootPath, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name);

    await this.repo.delete({ rootId });

    for (const category of categories) {
      const categoryPath = resolve(rootPath, category);
      const records = await this.walkCategory(rootId, category, categoryPath);
      await this.insertInBatches(records);
    }
  }

  private async insertInBatches(records: FileRecord[]) {
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      if (batch.length > 0) {
        await this.repo.upsert(batch, ['rootId', 'category', 'relPath']);
      }
    }
  }

  private async walkCategory(
    rootId: string,
    category: string,
    dir: string,
    relBase = '',
  ): Promise<FileRecord[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const results: FileRecord[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
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

  async removeMany(rootId: string, category: string, relPaths: string[]) {
    const rows = await this.repo.find({
      where: { rootId, category, relPath: In(relPaths) },
      select: { id: true },
    });
    if (rows.length === 0) return;
    await this.repo.delete(rows.map((r) => r.id));
  }
}
