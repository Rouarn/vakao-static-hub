/**
 * 文件操作服务
 * 处理文件系统交互、路径安全校验和数据库查询
 * 提供文件的增删改查功能
 */

import { Injectable } from '@nestjs/common';
import {
  access,
  constants,
  ensureDir,
  readdir,
  remove,
  stat,
  writeFile,
} from 'fs-extra';
import { dirname, isAbsolute, join, resolve } from 'path';
import { platform } from 'os';
import { ResourceRootsService } from '../../infra/resource-roots/resource-roots.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntryEntity } from '../../infra/database/entities/file-entry.entity';
import {
  safeJoin,
  normalizeCategoryPath,
  getFileExtension,
} from './utils/path-utils';

/**
 * 文件操作服务类
 * 封装文件系统操作和数据库交互
 */
@Injectable()
export class FilesService {
  constructor(
    private readonly resourceRoots: ResourceRootsService,
    @InjectRepository(FileEntryEntity)
    private readonly repo: Repository<FileEntryEntity>,
  ) {}

  /**
   * 在指定资源根目录和分类下安全拼接路径
   *
   * @param rootId 根目录 ID
   * @param category 分类名
   * @param parts 路径片段
   * @returns 拼接后的安全路径
   */
  safeJoinCategory(rootId: string, category: string, parts: string[]) {
    const rootPath = this.resourceRoots.resolveRootPath(rootId);
    const { dbCategory } = normalizeCategoryPath(category);
    return safeJoin(rootPath, [dbCategory, ...parts]);
  }

  /**
   * 列出服务器系统目录
   * Windows 下列出驱动器，Unix 下列出根目录
   *
   * @param path 可选的父目录路径
   * @returns 目录列表
   */
  async listSystemDirectories(path?: string) {
    if (!path) {
      if (platform() === 'win32') {
        // Windows: 列出所有盘符 (A-Z)
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

  /**
   * 列出指定根目录下的所有分类（一级子目录）
   *
   * @param rootId 根目录 ID
   * @returns 分类名称列表
   */
  async listCategories(rootId: string) {
    const rootPath = this.resourceRoots.resolveRootPath(rootId);
    await ensureDir(rootPath);
    const dirs = await readdir(rootPath, { withFileTypes: true });
    return dirs
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));
  }

  /**
   * 分页查询文件列表
   * 从数据库中查询索引信息
   *
   * @param rootId 根目录 ID
   * @param category 分类名（支持嵌套路径）
   * @param opts 分页和查询选项
   * @returns 分页结果
   */
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
    // 规范化类别路径
    const { dbCategory, relPathSuffix } = normalizeCategoryPath(category);

    // 构建查询
    const qb = this.repo
      .createQueryBuilder('f')
      .where('f.rootId = :rootId', { rootId })
      .andWhere('f.category = :category', { category: dbCategory });

    // 如果有子路径前缀，添加路径过滤
    if (relPathSuffix) {
      qb.andWhere('f.relPath LIKE :prefix', { prefix: `${relPathSuffix}/%` });
    }

    // 处理搜索关键词
    if (opts.q && opts.q.trim()) {
      qb.andWhere('(f.name LIKE :q OR f.relPath LIKE :q)', {
        q: `%${opts.q.trim()}%`,
      });
    }

    // 处理排序
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

    // 分页
    const skip = (opts.page - 1) * opts.pageSize;
    qb.skip(skip).take(opts.pageSize);

    // 执行查询
    const [rows, total] = await qb.getManyAndCount();

    // 转换返回结果
    return {
      items: rows.map((r) => {
        let relativePath = r.relPath;
        // 去掉前缀，以便前端看到相对于所请求文件夹的路径
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

  /**
   * 保存文件到物理磁盘并更新索引
   *
   * @param rootId 根目录 ID
   * @param category 分类目录
   * @param filename 文件名
   * @param buffer 文件内容
   * @returns 文件信息
   */
  async saveFile(
    rootId: string,
    category: string,
    filename: string,
    buffer: Buffer,
  ) {
    // 规范化类别路径
    const { dbCategory, relPathSuffix } = normalizeCategoryPath(category);
    const relPath = relPathSuffix ? `${relPathSuffix}/${filename}` : filename;

    // 安全拼接目标路径
    const targetPath = safeJoin(this.resourceRoots.resolveRootPath(rootId), [
      dbCategory,
      relPath,
    ]);

    // 确保目录存在并写入文件
    await ensureDir(resolve(targetPath, '..'));
    await writeFile(targetPath, buffer);
    const s = await stat(targetPath);

    // 更新数据库索引
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

  /**
   * 批量保存文件
   *
   * @param rootId 根目录 ID
   * @param category 分类目录
   * @param files 文件列表
   * @returns 保存结果列表
   */
  async batchSaveFiles(
    rootId: string,
    category: string,
    files: Array<{ originalname: string; buffer: Buffer }>,
  ) {
    const results = [];
    for (const file of files) {
      try {
        // 修复：解决中文乱码问题
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

  /**
   * 删除物理文件和数据库索引
   * 如果文件所在目录变为空，则递归向上删除空目录
   *
   * @param rootId 根目录 ID
   * @param category 分类目录
   * @param filename 文件名
   */
  async deleteFile(rootId: string, category: string, filename: string) {
    // 规范化类别路径
    const { dbCategory, relPathSuffix } = normalizeCategoryPath(category);
    const relPath = relPathSuffix ? `${relPathSuffix}/${filename}` : filename;

    // 安全拼接目标路径
    const targetPath = safeJoin(this.resourceRoots.resolveRootPath(rootId), [
      dbCategory,
      relPath,
    ]);

    // 删除物理文件和数据库记录
    await remove(targetPath);
    await this.repo.delete({ rootId, category: dbCategory, relPath });

    // 递归删除空目录
    try {
      let currentDir = dirname(targetPath);
      const categoryRoot = safeJoin(
        this.resourceRoots.resolveRootPath(rootId),
        [dbCategory],
      );

      while (true) {
        // 防止删除到分类根目录以上
        if (
          !currentDir.startsWith(categoryRoot) ||
          currentDir === categoryRoot
        ) {
          break;
        }

        const files = await readdir(currentDir);
        if (files.length === 0) {
          await remove(currentDir);
          currentDir = dirname(currentDir);
        } else {
          break;
        }
      }
    } catch (e) {
      console.warn('清理空目录失败:', e);
    }
  }
}
