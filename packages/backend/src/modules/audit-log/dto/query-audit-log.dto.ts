import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

/** 审计日志分页查询参数 */
export class QueryAuditLogDto {
  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: '操作动作筛选', example: 'file.upload' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  action?: string;

  @ApiPropertyOptional({ description: '资源类型筛选', example: 'file' })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  resourceType?: string;

  @ApiPropertyOptional({ description: '操作用户名筛选', example: 'admin' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  username?: string;

  @ApiPropertyOptional({ description: '起始时间（毫秒时间戳）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  startTime?: number;

  @ApiPropertyOptional({ description: '结束时间（毫秒时间戳）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endTime?: number;
}
