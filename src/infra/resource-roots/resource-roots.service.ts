import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { mkdir, access, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { dirname } from 'node:path';

export interface ResourceRoot {
  id: string;
  name: string;
  path: string;
}

@Injectable()
export class ResourceRootsService implements OnModuleInit {
  private readonly configPath = join(process.cwd(), 'resources.json');
  private roots: ResourceRoot[] = [];

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async onModuleInit() {
    await this.loadConfig();
  }

  async loadConfig() {
    try {
      await access(this.configPath);
      const content = await readFile(this.configPath, 'utf-8');
      this.roots = JSON.parse(content) as ResourceRoot[];
      return;
    } catch {
      // File doesn't exist, use default
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

  async saveConfig() {
    await mkdir(dirname(this.configPath), { recursive: true });
    await writeFile(this.configPath, JSON.stringify(this.roots, null, 2));
  }

  getRoots() {
    return this.roots;
  }

  getRoot(id: string) {
    return this.roots.find((r) => r.id === id);
  }

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

  async addRoot(root: ResourceRoot) {
    if (this.roots.find((r) => r.id === root.id)) {
      throw new Error('Root ID already exists');
    }
    this.roots.push(root);
    await this.saveConfig();
    this.eventEmitter.emit('resource.updated');
  }

  async removeRoot(id: string) {
    this.roots = this.roots.filter((r) => r.id !== id);
    await this.saveConfig();
    this.eventEmitter.emit('resource.updated');
  }

  async updateRoot(id: string, updates: Partial<Omit<ResourceRoot, 'id'>>) {
    const index = this.roots.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('Resource root not found');
    }

    this.roots[index] = {
      ...this.roots[index],
      ...updates,
      id,
    };

    await this.saveConfig();
    this.eventEmitter.emit('resource.updated');
  }
}
