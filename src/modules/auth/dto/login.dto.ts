/**
 * 登录数据传输对象
 * 定义用户登录请求的参数结构
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 登录 DTO 类
 * 包含用户名和密码字段，用于身份验证
 */
export class LoginDto {
  /** 用户名 */
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  /** 密码 */
  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
