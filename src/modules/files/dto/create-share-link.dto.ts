/**
 * 创建分享链接 DTO
 * 定义创建分享链接的请求参数结构
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * 创建分享链接 DTO
 * 支持过期时间和访问次数限制
 */
export class CreateShareLinkDto {
  /** 资源根目录 ID */
  @ApiProperty({ description: '资源根目录 ID' })
  @IsString()
  rootId!: string;

  /** 分类目录名 */
  @ApiProperty({ description: '分类目录名' })
  @IsString()
  category!: string;

  /** 文件相对路径 */
  @ApiProperty({ description: '文件相对路径' })
  @IsString()
  filePath!: string;

  /** 有效期（毫秒），不传则永不过期 */
  @ApiPropertyOptional({ description: '有效期（毫秒），不传则永不过期' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  expiresInMs?: number;

  /** 最大访问次数，不传则不限制 */
  @ApiPropertyOptional({ description: '最大访问次数，不传则不限制' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  maxAccesses?: number;
}
