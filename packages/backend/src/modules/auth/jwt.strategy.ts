import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

/** JWT 载荷：sub 为用户 ID 字符串，username 为用户名 */
interface JwtPayload {
  sub?: string;
  username?: string;
}

/**
 * JWT 认证策略
 * 基于 passport-jwt 实现，用于验证请求中的 JWT 令牌
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      // 自定义 JWT 提取逻辑
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. 尝试从 Authorization: Bearer <token> 头提取
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. 尝试从查询参数 token 或 auth 提取 (支持 ?token=xxx 或 ?auth=Bearer%20xxx)
        (req: Request) => {
          if (!req) return null;
          const queryToken = req.query?.token;
          if (typeof queryToken === 'string' && queryToken.trim())
            return queryToken;

          const queryAuth = req.query?.auth;
          if (
            typeof queryAuth === 'string' &&
            queryAuth.startsWith('Bearer ')
          ) {
            return queryAuth.slice(7);
          }
          return null;
        },
      ]),
      ignoreExpiration: false, // 不忽略过期时间，过期将拒绝请求
      secretOrKey:
        configService.get<string>('auth.jwtSecret') ?? 'change-me-in-env', // 获取 JWT 密钥
    });
  }

  /**
   * 验证回调
   * JWT 验证通过后调用，返回值将被注入到 req.user 中
   * 同时会校验用户仍然存在于 users 表，已删除用户的旧令牌立即失效
   */
  async validate(payload: JwtPayload) {
    const userId = Number(payload?.sub);
    if (!Number.isInteger(userId)) {
      throw new UnauthorizedException();
    }
    const user = await this.authService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }
    return { userId: user.id, username: user.username };
  }
}
