import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareLinkEntity } from '../../infra/database/entities/share-link.entity';
import { CreateShareLinkDto } from './dto/create-share-link.dto';

@Injectable()
export class ShareService {
  constructor(
    @InjectRepository(ShareLinkEntity)
    private readonly repo: Repository<ShareLinkEntity>,
  ) {}

  async createShareLink(dto: CreateShareLinkDto) {
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

  async validateAndAccess(token: string) {
    const link = await this.repo.findOne({ where: { token } });
    if (!link) {
      throw new NotFoundException('分享链接不存在');
    }

    const now = Date.now();

    if (link.expiresAt && now > link.expiresAt) {
      throw new BadRequestException('分享链接已过期');
    }

    if (link.maxAccesses && link.accessCount >= link.maxAccesses) {
      throw new BadRequestException('分享链接访问次数已达上限');
    }

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

  async revokeShareLink(token: string) {
    const result = await this.repo.delete({ token });
    if (result.affected === 0) {
      throw new NotFoundException('分享链接不存在');
    }
    return { success: true };
  }

  private generateToken(): string {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16),
    );
  }
}
