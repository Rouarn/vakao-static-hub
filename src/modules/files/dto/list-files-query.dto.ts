/**
 * 文件列表查询参数 DTO
 * 定义分页查询文件列表的请求参数结构
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * 文件列表查询 DTO
 * 支持分页、搜索和排序功能
 */
export class ListFilesQueryDto {
  /** 页码，从 1 开始 */
  @ApiProperty({ description: '页码', default: 1, required: false })
  @Transform(({ value }) => (value == null ? 1 : Number(value)))
  @IsInt()
  @Min(1)
  page: number = 1;

  /** 每页数量，最大 500 */
  @ApiProperty({ description: '每页数量', default: 100, required: false })
  @Transform(({ value }) => (value == null ? 100 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize: number = 100;

  /** 搜索关键词，匹配文件名或路径 */
  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  q?: string;

  /** 排序字段 */
  @ApiProperty({
    description: '排序字段',
    enum: ['name', 'size', 'mtime'],
    required: false,
  })
  @IsOptional()
  @IsIn(['name', 'size', 'mtime'])
  sort?: 'name' | 'size' | 'mtime';

  /** 排序顺序 */
  @ApiProperty({
    description: '排序顺序',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
