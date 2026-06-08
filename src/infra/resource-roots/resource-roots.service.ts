/**
 * 资源根目录管理服务
 * 管理多个资源存储位置，支持动态添加、删除根目录配置
 * 配置持久化存储在 resources.json 文件中
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ensureFile, pathExists, readJson, writeJson } from 'fs-extra';
import { isAbsolute, join, resolve } from 'path';

/**
 * 资源根目录接口
 * 定义资源存储位置的配置结构
 */
export interface ResourceRoot {
  /** 根目录唯一标识符 */
  id: string;
  /** 根目录显示名称 */
  name: string;
  /** 根目录物理路径 */
  path: string;
}

/**
 * 资源根目录管理服务类
 * 实现 OnModuleInit 接口，在模块初始化时自动加载配置
 */
@Injectable()
export class ResourceRootsService implements OnModuleInit {
  private readonly configPath = join(process.cwd(), 'resources.json');
  private roots: ResourceRoot[] = [];

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * 模块初始化时加载配置
   */
  async onModuleInit() {
    await this.loadConfig();
  }

  /**
   * 加载资源配置
   * 如果配置文件不存在，则创建默认配置
   */
  async loadConfig() {
    if (await pathExists(this.configPath)) {
      this.roots = (await readJson(this.configPath)) as ResourceRoot[];
      return;
    }

    this.roots = [
      {
        id: 'default',
        name: '默认资源存储',
        path: 'resources',
      },
    ];
    await this.saveConfig();
  }

  /**
   * 保存配置到文件
   */
  async saveConfig() {
    await ensureFile(this.configPath);
    await writeJson(this.configPath, this.roots, { spaces: 2 });
  }

  /**
   * 获取所有资源根目录
   * @returns 资源根目录列表
   */
  getRoots() {
    return this.roots;
  }

  /**
   * 根据 ID 获取单个资源根目录
   * @param id 根目录 ID
   * @returns 资源根目录配置，不存在则返回 undefined
   */
  getRoot(id: string) {
    return this.roots.find((r) => r.id === id);
  }

  /**
   * 解析根目录的绝对路径
   * @param id 根目录 ID
   */
  resolveRootPath(id: string) {
    const root = this.getRoot(id);
    if (!root) {
      throw new Error(`Resource root not found: ${id}`);
    }
    if (isAbsolute(root.path)) {
      return root.path;
    }
    return resolve(process.cwd(), root.path);
  }

  /**
   * 添加新的资源根目录
   * 并触发 'resource.updated' 事件
   */
  async addRoot(root: ResourceRoot) {
    if (this.roots.find((r) => r.id === root.id)) {
      throw new Error('Root ID already exists');
    }
    this.roots.push(root);
    await this.saveConfig();
    this.eventEmitter.emit('resource.updated');
  }

  /**
   * 删除资源根目录
   * 并触发 'resource.updated' 事件
   */
  async removeRoot(id: string) {
    this.roots = this.roots.filter((r) => r.id !== id);
    await this.saveConfig();
    this.eventEmitter.emit('resource.updated');
  }

  /**
   * 更新资源根目录
   * 并触发 'resource.updated' 事件
   */
  async updateRoot(id: string, updates: Partial<Omit<ResourceRoot, 'id'>>) {
    const index = this.roots.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('Resource root not found');
    }

    this.roots[index] = {
      ...this.roots[index],
      ...updates,
      id, // Ensure ID doesn't change
    };

    await this.saveConfig();
    this.eventEmitter.emit('resource.updated');
  }
}
