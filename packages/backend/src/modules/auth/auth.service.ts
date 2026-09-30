import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { LoginResponse, UserInfo } from '@vakao/shared';
import { UserEntity } from '../../infra/database/entities/user.entity.js';
import { hashPassword, verifyPassword } from './utils/password.util.js';

/**
 * 认证服务
 * 基于 users 表完成用户注册、凭证校验和 JWT 签发
 */
@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * 模块初始化时播种默认管理员
   * 仅在 users 表为空时执行，账号密码取自 AUTH_USER/AUTH_PASS 配置
   */
  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count > 0) {
      return;
    }

    const username = this.configService.get<string>('auth.user') ?? 'admin';
    const password = this.configService.get<string>('auth.pass') ?? 'admin';
    const now = Date.now();

    const user = this.userRepo.create({
      username,
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });
    await this.userRepo.save(user);
    this.logger.log(`users 表为空，已初始化默认管理员账号: ${username}`);
  }

  /**
   * 注册新用户并直接签发令牌（注册即登录）
   * @param username 用户名
   * @param password 明文密码
   */
  async register(username: string, password: string): Promise<LoginResponse> {
    const existing = await this.userRepo.findOne({ where: { username } });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const now = Date.now();
    const user = this.userRepo.create({
      username,
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });
    const saved = await this.userRepo.save(user);
    this.logger.log(`新用户注册成功: ${username} (id=${saved.id})`);

    return this.issueToken(saved);
  }

  /**
   * 校验用户名密码并生成令牌
   * @param username 用户名
   * @param password 密码
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return this.issueToken(user);
  }

  /** 按 ID 查询用户信息，供 JWT 策略与个人信息接口使用 */
  async findById(id: number): Promise<UserInfo | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    return user ? this.toUserInfo(user) : null;
  }

  /** 用户修改自己的密码 */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    const valid = await verifyPassword(oldPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('当前密码错误');
    }
    user.passwordHash = await hashPassword(newPassword);
    user.updatedAt = Date.now();
    await this.userRepo.save(user);
    this.logger.log(`用户 ${user.username} (id=${userId}) 修改密码成功`);
    return { success: true };
  }

  /** 获取全部用户列表（不含密码哈希） */
  async listUsers() {
    const users = await this.userRepo.find({ order: { createdAt: 'ASC' } });
    return users.map((u) => this.toUserInfo(u));
  }

  /** 删除用户（禁止删除自己） */
  async deleteUser(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new UnauthorizedException('不能删除当前登录用户');
    }
    const result = await this.userRepo.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
    this.logger.log(`用户 id=${id} 已被删除`);
    return { success: true };
  }

  /** 签发 JWT 并组装登录响应 */
  private async issueToken(user: UserEntity): Promise<LoginResponse> {
    const expiresIn = (this.configService.get<string>('auth.jwtExpiresIn') ??
      '12h') as JwtSignOptions['expiresIn'];

    const accessToken = await this.jwtService.signAsync(
      { sub: String(user.id), username: user.username },
      { expiresIn },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: String(expiresIn),
      user: this.toUserInfo(user),
    };
  }

  private toUserInfo(user: UserEntity): UserInfo {
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}
