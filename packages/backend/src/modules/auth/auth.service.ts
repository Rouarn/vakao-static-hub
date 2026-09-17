import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

/**
 * 认证服务
 * 处理用户凭证验证和 JWT 签发
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 验证用户并生成令牌
   * @param username 用户名
   * @param password 密码
   * @returns 包含 AccessToken 的对象
   */
  async login(
    username: string,
    password: string,
  ): Promise<{
    accessToken: string;
    tokenType: string;
    expiresIn: string | number | undefined;
  }> {
    // 从配置中获取预设的用户名和密码
    const expectedUser = this.configService.get<string>('auth.user');
    const expectedPass = this.configService.get<string>('auth.pass');

    // 简单验证逻辑：比对配置中的固定凭证
    if (
      !expectedUser ||
      !expectedPass ||
      username !== expectedUser ||
      password !== expectedPass
    ) {
      throw new UnauthorizedException();
    }

    const expiresIn = (this.configService.get<string>('auth.jwtExpiresIn') ??
      '12h') as JwtSignOptions['expiresIn'];

    // 签发 JWT
    const accessToken = await this.jwtService.signAsync(
      { sub: username },
      { expiresIn },
    );

    return { accessToken, tokenType: 'Bearer', expiresIn };
  }
}
