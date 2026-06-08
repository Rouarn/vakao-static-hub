/**
 * 资源根目录数据传输对象
 * 定义创建和更新资源根目录的参数结构
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * 创建资源根目录 DTO
 * 用于添加新的存储根目录配置
 */
export class CreateResourceRootDto {
  /** 根目录唯一标识符，仅允许字母、数字、下划线和连字符 */
  @ApiProperty({ description: '根目录 ID (唯一标识)', example: 'my-disk' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,30}$/)
  id!: string;

  /** 根目录显示名称 */
  @ApiProperty({ description: '显示名称', example: '我的硬盘' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  /** 根目录物理路径 */
  @ApiProperty({ description: '物理路径', example: 'D:/Data/MyFiles' })
  @IsString()
  @IsNotEmpty()
  path!: string;
}

/**
 * 更新资源根目录 DTO
 * 继承自 CreateResourceRootDto，所有字段可选
 */
export class UpdateResourceRootDto extends PartialType(CreateResourceRootDto) {}
