import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

/**
 * Token 黑名单服务
 * 登出/吊销的 Token 在过期前加入黑名单，防止泄露后被冒用
 * 内存 Map 实现，适合单实例部署；集群部署需外置 Redis
 */
@Injectable()
export class TokenBlacklistService implements OnModuleDestroy {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly revoked = new Map<string, number>();
  private readonly cleanupTimer: ReturnType<typeof setInterval>;

  constructor() {
    // 每 10 分钟清理已过期的 token，防止内存泄漏
    this.cleanupTimer = setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  /** 吊销 token，直到其过期时间 */
  revoke(token: string, expiresAtMs: number) {
    this.revoked.set(token, expiresAtMs);
    this.logger.debug(
      `Token revoked, current blacklist size: ${this.revoked.size}`,
    );
  }

  /** 检查 token 是否已被吊销 */
  isRevoked(token: string): boolean {
    return this.revoked.has(token);
  }

  private cleanup() {
    const now = Date.now();
    let count = 0;
    for (const [token, exp] of this.revoked) {
      if (exp <= now) {
        this.revoked.delete(token);
        count++;
      }
    }
    if (count > 0) {
      this.logger.debug(
        `Cleaned ${count} expired revoked tokens, current size: ${this.revoked.size}`,
      );
    }
  }
}
