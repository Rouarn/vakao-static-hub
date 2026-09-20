import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { LoginResponse, UserInfo } from '@vakao/shared';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { Public } from './decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

/**
 * 认证控制器
 * 处理用户注册、登录、令牌生成与当前用户信息
 */
@ApiTags('认证')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册接口
   * 校验用户名唯一后创建用户，并直接返回 JWT 令牌（注册即登录）
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: RegisterDto, description: '注册信息' })
  async register(@Body() body: RegisterDto): Promise<LoginResponse> {
    return await this.authService.register(body.username, body.password);
  }

  /**
   * 用户登录接口
   * 验证用户名密码并返回 JWT 令牌
   */
  @Public()
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: LoginDto, description: '登录凭证' })
  async login(@Body() body: LoginDto): Promise<LoginResponse> {
    return await this.authService.login(body.username, body.password);
  }

  /**
   * 获取当前登录用户信息
   */
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前登录用户信息' })
  async profile(
    @CurrentUser() currentUser: { userId: number; username: string },
  ): Promise<UserInfo> {
    const user = await this.authService.findById(currentUser.userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }
    return user;
  }
}
