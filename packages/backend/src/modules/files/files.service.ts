import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  access,
  constants,
  mkdir,
  readdir,
  rename as fsRename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { platform } from 'node:os';
import { ResourceRootsService } from '../../infra/resource-roots/resource-roots.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntryEntity } from '../../infra/database/entities/file-entry.entity';
import { ShareLinkEntity } from '../../infra/database/entities/share-link.entity';
import {
  safeJoin,
  normalizeCategoryPath,
  getFileExtension,
} from './utils/path-utils';

@Injectable()
export class FilesService {
  constructor(
    private readonly resourceRoots: ResourceRootsService,
    @InjectRepository(FileEntryEntity)
    private readonly repo: Repository<FileEntryEntity>,
    @InjectRepository(ShareLinkEntity)
    private readonly shareRepo: Repository<ShareLinkEntity>,
  ) {}

  safeJoinCategory(rootId: string, category: string, parts: string[]) {
    const rootPath = this.resourceRoots.resolveRootPath(rootId);
    const { dbCategory } = normalizeCategoryPath(category);
    return safeJoin(rootPath, [dbCategory, ...parts]);
  }

  async listSystemDirectories(path?: string) {
    if (!path) {
      if (platform() === 'win32') {
        const drives = [];
        for (let i = 65; i <= 90; i++) {
          const letter = String.fromCharCode(i);
          const driveRoot = `${letter}:\\`;
          try {
            await access(driveRoot, constants.F_OK);
            drives.push({ name: `${letter}:`, path: driveRoot });
          } catch {
            // ignore inaccessible drives
          }
        }
        return drives;
      } else {
        path = '/';
      }
    }

    const target = isAbsolute(path) ? path : resolve(process.cwd(), path);
    const entries = await readdir(target, { withFileTypes: true });
    return entries
      .filter((d) => d.isDirectory())
      .map((d) => ({ name: d.name, path: join(target, d.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async listCategories(rootId: string) {
    const rootPath = this.resourceRoots.resolveRootPath(rootId);
    await mkdir(rootPath, { recursive: true });
    const dirs = await readdir(rootPath, { withFileTypes: true });
    return dirs
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));
  }

  async listFilesPaged(
    rootId: string,
    category: string,
    opts: {
      page: number;
      pageSize: number;
      q?: string;
      sort?: string;
      order?: 'asc' | 'desc';
    },
  ) {
    const { dbCategory, relPathSuffix } = normalizeCategoryPath(category);

    const qb = this.repo
      .createQueryBuilder('f')
      .where('f.rootId = :rootId', { rootId })
      .andWhere('f.category = :category', { category: dbCategory });

    if (relPathSuffix) {
      qb.andWhere('f.relPath LIKE :prefix', { prefix: `${relPathSuffix}/%` });
    }

    if (opts.q && opts.q.trim()) {
      qb.andWhere('(f.name LIKE :q OR f.relPath LIKE :q)', {
        q: `%${opts.q.trim()}%`,
      });
    }

    const sortField = opts.sort || 'mtime';
    const sortOrder = (opts.order || 'desc').toUpperCase() as 'ASC' | 'DESC';

    if (sortField === 'mtime') {
      qb.orderBy('f.mtimeMs', sortOrder);
    } else if (sortField === 'name') {
      qb.orderBy('f.name', sortOrder);
    } else if (sortField === 'size') {
      qb.orderBy('f.size', sortOrder);
    } else {
      qb.orderBy('f.mtimeMs', 'DESC');
    }

    const skip = (opts.page - 1) * opts.pageSize;
    qb.skip(skip).take(opts.pageSize);

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map((r) => {
        let relativePath = r.relPath;
        if (relPathSuffix && relativePath.startsWith(relPathSuffix + '/')) {
          relativePath = relativePath.substring(relPathSuffix.length + 1);
        }
        return {
          name: r.name,
          path: relativePath,
          size: r.size,
          mtime: r.mtimeMs,
        };
      }),
      total,
      page: opts.page,
      pageSize: opts.pageSize,
    };
  }

  async saveFile(
    rootId: string,
    category: string,
    filename: string,
    buffer: Buffer,
  ) {
    const { dbCategory, relPathSuffix } = normalizeCategoryPath(category);
    const relPath = relPathSuffix ? `${relPathSuffix}/${filename}` : filename;

    const targetPath = safeJoin(this.resourceRoots.resolveRootPath(rootId), [
      dbCategory,
      relPath,
    ]);

    await mkdir(resolve(targetPath, '..'), { recursive: true });
    await writeFile(targetPath, buffer);
    const s = await stat(targetPath);

    await this.repo.upsert(
      {
        rootId,
        category: dbCategory,
        relPath,
        name: filename,
        ext: getFileExtension(filename),
        size: s.size,
        mtimeMs: s.mtimeMs,
      },
      ['rootId', 'category', 'relPath'],
    );

    return {
      name: filename,
      path: filename,
      size: s.size,
      mtime: s.mtimeMs,
    };
  }

  async batchSaveFiles(
    rootId: string,
    category: string,
    files: Array<{ originalname: string; buffer: Buffer }>,
  ) {
    const results = [];
    for (const file of files) {
      try {
        const originalName = Buffer.from(file.originalname, 'latin1').toString(
          'utf8',
        );
        await this.saveFile(rootId, category, originalName, file.buffer);
        results.push({ name: originalName, success: true });
      } catch (e) {
        results.push({
          name: file.originalname,
          success: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    return results;
  }

  async deleteFile(rootId: string, category: string, filename: string) {
    const { dbCategory, relPathSuffix } = normalizeCategoryPath(category);
    const relPath = relPathSuffix ? `${relPathSuffix}/${filename}` : filename;

    const targetPath = safeJoin(this.resourceRoots.resolveRootPath(rootId), [
      dbCategory,
      relPath,
    ]);

    await rm(targetPath, { force: true });
    await this.repo.delete({ rootId, category: dbCategory, relPath });

    try {
      let currentDir = dirname(targetPath);
      const categoryRoot = safeJoin(
        this.resourceRoots.resolveRootPath(rootId),
        [dbCategory],
      );

      while (true) {
        if (
          !currentDir.startsWith(categoryRoot) ||
          currentDir === categoryRoot
        ) {
          break;
        }

        const files = await readdir(currentDir);
        if (files.length === 0) {
          await rm(currentDir, { force: true });
          currentDir = dirname(currentDir);
        } else {
          break;
        }
      }
    } catch (e) {
      console.warn('清理空目录失败:', e);
    }
  }

  /**
   * 校验文件名是否为合法的 basename
   * 禁止路径分隔符、控制字符、"." / ".." 以及首尾空白
   */
  private validateBasename(name: string): string {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    const hasControlChar =
      trimmed.length > 0 &&
      Array.from(trimmed).some((ch) => ch.charCodeAt(0) <= 31);
    if (
      !trimmed ||
      trimmed === '.' ||
      trimmed === '..' ||
      trimmed.includes('\\') ||
      trimmed.includes('/') ||
      hasControlChar
    ) {
      throw new BadRequestException('文件名不合法');
    }
    return trimmed;
  }

  /**
   * 重命名文件（仅允许修改 basename，不改变所在目录）
   * 严格模式：源文件不存在直接报错；目标路径已存在返回冲突
   * 物理文件、文件索引与分享链接路径在同一操作内同步更新
   */
  async renameFile(
    rootId: string,
    category: string,
    filename: string,
    newName: string,
  ) {
    const targetName = this.validateBasename(newName);

    const { dbCategory, relPathSuffix } = normalizeCategoryPath(category);
    const oldRelPath = relPathSuffix
      ? `${relPathSuffix}/${filename}`
      : filename;

    // 仅替换 basename，保留原有目录段
    const dirPart = dirname(oldRelPath);
    const newRelPath =
      dirPart === '.' ? targetName : `${dirPart}/${targetName}`;

    if (oldRelPath === newRelPath) {
      throw new BadRequestException('新文件名与原文件名相同');
    }

    const rootPath = this.resourceRoots.resolveRootPath(rootId);
    const oldFullPath = safeJoin(rootPath, [dbCategory, oldRelPath]);
    const newFullPath = safeJoin(rootPath, [dbCategory, newRelPath]);

    // 源文件必须真实存在，避免产生磁盘与索引不一致的记录
    let sourceStat;
    try {
      sourceStat = await stat(oldFullPath);
    } catch {
      throw new NotFoundException('文件不存在');
    }
    if (!sourceStat.isFile()) {
      throw new BadRequestException('目标不是文件');
    }

    // 目标路径已存在（磁盘或索引任一命中即视为冲突）
    try {
      await access(newFullPath, constants.F_OK);
      throw new ConflictException('同名文件已存在');
    } catch (e) {
      if (e instanceof ConflictException) throw e;
    }

    const indexConflict = await this.repo.findOne({
      where: { rootId, category: dbCategory, relPath: newRelPath },
    });
    if (indexConflict) {
      throw new ConflictException('同名文件已存在');
    }

    await fsRename(oldFullPath, newFullPath);

    const s = await stat(newFullPath);
    await this.repo.update(
      { rootId, category: dbCategory, relPath: oldRelPath },
      {
        relPath: newRelPath,
        name: targetName,
        ext: getFileExtension(targetName),
        size: s.size,
        mtimeMs: s.mtimeMs,
      },
    );

    // 同步更新指向该文件的分享链接（filePath 相对分类目录）
    const fileDir = dirname(filename);
    const newFilePath =
      fileDir === '.' ? targetName : `${fileDir}/${targetName}`;
    if (filename !== newFilePath) {
      await this.shareRepo.update(
        { rootId, category, filePath: filename },
        { filePath: newFilePath },
      );
    }

    return {
      name: targetName,
      path: newFilePath,
      size: s.size,
      mtime: s.mtimeMs,
    };
  }
}
