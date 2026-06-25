/**
 * 分享链接服务
 * 处理分享链接的创建、验证和管理
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareLinkEntity } from '../../infra/database/entities/share-link.entity';
import { CreateShareLinkDto } from './dto/create-share-link.dto';

/**
 * 分享链接服务类
 * 封装分享链接的 CRUD 操作和访问验证逻辑
 */
@Injectable()
export class ShareService {
  constructor(
    @InjectRepository(ShareLinkEntity)
    private readonly repo: Repository<ShareLinkEntity>,
  ) {}

  /**
   * 创建分享链接
   *
   * @param dto 创建分享链接参数
   * @returns 创建的分享链接信息
   */
  async createShareLink(dto: CreateShareLinkDto) {
    // 生成不含连字符的 UUID 作为 token
    const token = this.generateToken();

    const entity = this.repo.create({
      token,
      rootId: dto.rootId,
      category: dto.category,
      filePath: dto.filePath,
      expiresAt: dto.expiresInMs ? Date.now() + dto.expiresInMs : null,
      maxAccesses: dto.maxAccesses ?? null,
      accessCount: 0,
      createdAt: Date.now(),
    });

    const saved = await this.repo.save(entity);
    return {
      id: saved.id,
      token: saved.token,
      rootId: saved.rootId,
      category: saved.category,
      filePath: saved.filePath,
      expiresAt: saved.expiresAt,
      maxAccesses: saved.maxAccesses,
      accessCount: saved.accessCount,
      createdAt: saved.createdAt,
    };
  }

  /**
   * 验证并访问分享链接
   * 检查链接有效性（是否过期、访问次数是否超限），并增加访问计数
   *
   * @param token 分享 token
   * @returns 分享链接信息（包含文件路径）
   */
  async validateAndAccess(token: string) {
    const link = await this.repo.findOne({ where: { token } });
    if (!link) {
      throw new NotFoundException('分享链接不存在');
    }

    const now = Date.now();

    // 检查是否过期
    if (link.expiresAt && now > link.expiresAt) {
      throw new BadRequestException('分享链接已过期');
    }

    // 检查访问次数是否超限
    if (link.maxAccesses && link.accessCount >= link.maxAccesses) {
      throw new BadRequestException('分享链接访问次数已达上限');
    }

    // 增加访问计数
    await this.repo.increment({ id: link.id }, 'accessCount', 1);

    return {
      rootId: link.rootId,
      category: link.category,
      filePath: link.filePath,
      expiresAt: link.expiresAt,
      maxAccesses: link.maxAccesses,
      accessCount: link.accessCount + 1,
    };
  }

  /**
   * 列出所有分享链接
   *
   * @returns 分享链接列表
   */
  async listShareLinks() {
    const links = await this.repo.find({
      order: { createdAt: 'DESC' },
    });
    return links.map((link) => ({
      id: link.id,
      token: link.token,
      rootId: link.rootId,
      category: link.category,
      filePath: link.filePath,
      expiresAt: link.expiresAt,
      maxAccesses: link.maxAccesses,
      accessCount: link.accessCount,
      createdAt: link.createdAt,
    }));
  }

  /**
   * 撤销分享链接
   *
   * @param token 分享 token
   */
  async revokeShareLink(token: string) {
    const result = await this.repo.delete({ token });
    if (result.affected === 0) {
      throw new NotFoundException('分享链接不存在');
    }
    return { success: true };
  }

  /**
   * 生成不含连字符的 UUID
   */
  private generateToken(): string {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16),
    );
  }
}
