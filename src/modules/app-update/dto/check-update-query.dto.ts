import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CheckUpdateQueryDto {
  @ApiProperty({ description: '平台，当前仅 android', example: 'android' })
  @IsIn(['android'], { message: 'platform 仅支持 android' })
  platform!: string;

  @ApiProperty({
    description: '应用标识（apk 根下的分类目录名）',
    example: 'xiaolv',
  })
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'appKey 仅允许字母数字与 _ -',
  })
  appKey!: string;

  @ApiProperty({
    description: '客户端当前整数版本号（判定基准）',
    example: 100,
  })
  @Type(() => Number)
  @IsInt({ message: 'versionCode 必须为整数' })
  @Min(0)
  versionCode!: number;

  @ApiPropertyOptional({
    description: '客户端当前版本名，仅统计用',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  versionName?: string;

  @ApiPropertyOptional({ description: '设备唯一标识，灰度分桶用' })
  @IsOptional()
  @IsString()
  @Length(1, 128)
  deviceId?: string;
}
