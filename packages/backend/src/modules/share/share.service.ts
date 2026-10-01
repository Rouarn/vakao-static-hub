import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ShareLinkEntity } from '#/infra/database/entities/share-link.entity.js';
import { ShareAccessLogEntity } from '#/infra/database/entities/share-access-log.entity.js';
import { CreateShareLinkDto } from './dto/create-share-link.dto.js';
import { hashPassword, verifyPassword } from '../auth/utils/password.util.js';

/** 分享访问令牌有效期：30 分钟 */
const SHARE_ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class ShareService {
  private readonly logger = new Logger(ShareService.name);

  constructor(
    @InjectRepository(ShareLinkEntity)
    private readonly repo: Repository<ShareLinkEntity>,
    @InjectRepository(ShareAccessLogEntity)
    private readonly accessLogRepo: Repository<ShareAccessLogEntity>,
  ) {}

  async createShareLink(dto: CreateShareLinkDto) {
    const token = this.generateToken();
    const shareType = dto.shareType ?? 'file';

    // collection 类型时，将 filePaths 序列化为 JSON 存储；单文件保持原有行为
    const filePathsJson =
      shareType === 'collection' && dto.filePaths?.length
        ? JSON.stringify(dto.filePaths)
        : null;

    const entity = this.repo.create({
      token,
      rootId: dto.rootId,
      category: dto.category,
      filePath: dto.filePath,
      shareType,
      filePaths: filePathsJson,
      expiresAt: dto.expiresInMs ? Date.now() + dto.expiresInMs : null,
      maxAccesses: dto.maxAccesses ?? null,
      passwordHash: dto.password ? await hashPassword(dto.password) : null,
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
      shareType: saved.shareType,
      filePaths: this.parseFilePaths(saved.filePaths),
      expiresAt: saved.expiresAt,
      maxAccesses: saved.maxAccesses,
      hasPassword: !!saved.passwordHash,
      accessCount: saved.accessCount,
      createdAt: saved.createdAt,
    };
  }

  /**
   * 校验分享链接并返回文件信息
   * @param token 分享 token
   * @param accessToken 可选的访问令牌（有密码保护时必填）
   */
  async validateAndAccess(token: string, accessToken?: string) {
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

    // 有密码保护时必须提供有效的访问令牌
    if (link.passwordHash) {
      if (!accessToken) {
        throw new UnauthorizedException('该分享链接需要访问密码');
      }
      if (!this.validateShareAccessToken(token, accessToken)) {
        throw new UnauthorizedException('访问令牌无效或已过期');
      }
    }

    await this.repo.increment({ id: link.id }, 'accessCount', 1);

    return {
      rootId: link.rootId,
      category: link.category,
      filePath: link.filePath,
      shareType: link.shareType,
      filePaths: this.parseFilePaths(link.filePaths),
      expiresAt: link.expiresAt,
      maxAccesses: link.maxAccesses,
      accessCount: link.accessCount + 1,
    };
  }

  /**
   * 获取分享链接的公开信息（用于前端判断是否需要密码）
   * 不返回敏感字段（如 passwordHash）
   */
  async getShareInfo(token: string) {
    const link = await this.repo.findOne({ where: { token } });
    if (!link) {
      throw new NotFoundException('分享链接不存在');
    }
    return {
      token: link.token,
      rootId: link.rootId,
      category: link.category,
      filePath: link.filePath,
      shareType: link.shareType,
      filePaths: this.parseFilePaths(link.filePaths),
      expiresAt: link.expiresAt,
      maxAccesses: link.maxAccesses,
      hasPassword: !!link.passwordHash,
    };
  }

  /**
   * 校验分享密码，验证通过则签发临时访问令牌
   */
  async verifySharePassword(token: string, password: string) {
    const link = await this.repo.findOne({ where: { token } });
    if (!link) {
      throw new NotFoundException('分享链接不存在');
    }

    if (!link.passwordHash) {
      // 无密码保护的链接直接签发访问令牌
      return { success: true, accessToken: this.signShareAccessToken(token) };
    }

    const ok = await verifyPassword(password, link.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('访问密码错误');
    }

    return { success: true, accessToken: this.signShareAccessToken(token) };
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
      shareType: link.shareType,
      filePaths: this.parseFilePaths(link.filePaths),
      expiresAt: link.expiresAt,
      maxAccesses: link.maxAccesses,
      hasPassword: !!link.passwordHash,
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

  /**
   * 异步写入一条分享访问记录
   * 采用 fire-and-forget 方式，记录失败仅打印日志，不影响文件访问
   */
  recordAccess(token: string, ip: string | null, userAgent: string | null) {
    const entity = this.accessLogRepo.create({
      shareToken: token,
      ip,
      userAgent,
      accessedAt: Date.now(),
    });
    void this.accessLogRepo.save(entity).catch((error: unknown) => {
      this.logger.warn(
        `写入分享访问记录失败 (token=${token}): ${String(error)}`,
      );
    });
  }

  /** 获取指定分享链接的访问记录列表，按访问时间倒序 */
  async listAccessLogs(token: string) {
    const link = await this.repo.findOne({ where: { token } });
    if (!link) {
      throw new NotFoundException('分享链接不存在');
    }
    const logs = await this.accessLogRepo.find({
      where: { shareToken: token },
      order: { accessedAt: 'DESC' },
    });
    return logs.map((log) => ({
      id: log.id,
      shareToken: log.shareToken,
      ip: log.ip,
      userAgent: log.userAgent,
      accessedAt: log.accessedAt,
    }));
  }

  /** 将数据库中的 JSON 字符串解析为 string[]，解析失败返回 null */
  private parseFilePaths(filePaths: string | null): string[] | null {
    if (!filePaths) return null;
    try {
      const parsed = JSON.parse(filePaths) as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : null;
    } catch {
      return null;
    }
  }

  private generateToken(): string {
    return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16),
    );
  }

  /**
   * 签发分享访问令牌
   * 格式：<timestamp>.<hmac>，有效期 30 分钟
   * 使用 JWT_SECRET 作为 HMAC 密钥
   */
  private signShareAccessToken(token: string): string {
    const timestamp = Date.now();
    const payload = `${token}.${timestamp}`;
    const hmac = createHmac('sha256', this.getHmacSecret())
      .update(payload)
      .digest('hex');
    return `${timestamp}.${hmac}`;
  }

  /**
   * 校验分享访问令牌是否有效且未过期
   */
  private validateShareAccessToken(
    token: string,
    accessToken: string,
  ): boolean {
    const parts = accessToken.split('.');
    if (parts.length !== 2) return false;

    const timestamp = Number(parts[0]);
    if (!Number.isFinite(timestamp)) return false;

    // 令牌已过期
    if (Date.now() - timestamp > SHARE_ACCESS_TOKEN_TTL_MS) return false;

    const payload = `${token}.${timestamp}`;
    const expected = createHmac('sha256', this.getHmacSecret())
      .update(payload)
      .digest('hex');

    return timingSafeEqual(
      Buffer.from(parts[1], 'hex'),
      Buffer.from(expected, 'hex'),
    );
  }

  /**
   * 获取 HMAC 密钥，优先使用 JWT_SECRET 环境变量
   */
  private getHmacSecret(): string {
    return process.env.JWT_SECRET ?? 'vakao-share-access-secret';
  }
}
