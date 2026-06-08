import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

/**
 * 认证控制器
 * 处理用户登录和令牌生成
 */
@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录接口
   * 验证用户名密码并返回 JWT 令牌
   */
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: LoginDto, description: '登录凭证' })
  async login(@Body() body: LoginDto): Promise<{
    accessToken: string;
    tokenType: string;
    expiresIn: string | number | undefined;
  }> {
    return await this.authService.login(body.username, body.password);
  }
}
