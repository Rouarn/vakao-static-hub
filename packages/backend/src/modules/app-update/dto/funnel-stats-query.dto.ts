import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class FunnelStatsQueryDto {
  @ApiProperty({ description: '应用标识', example: 'xiaolv' })
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'appKey 仅允许字母数字与 _ -',
  })
  appKey!: string;

  @ApiPropertyOptional({ description: '开始时间戳（毫秒）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startTime?: number;

  @ApiPropertyOptional({ description: '结束时间戳（毫秒）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  endTime?: number;
}
