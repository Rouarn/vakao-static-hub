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

/** 客户端升级漏斗事件枚举 */
export const UPGRADE_EVENTS = [
  'check_no_update',
  'prompt_show',
  'download_start',
  'download_success',
  'download_fail',
  'verify_fail',
  'install_success',
  'install_fail',
  'new_version_launch',
] as const;

export type UpgradeEvent = (typeof UPGRADE_EVENTS)[number];

export class ReportEventDto {
  @ApiProperty({ description: '设备唯一标识' })
  @IsString()
  @Length(1, 128)
  deviceId!: string;

  @ApiProperty({ description: '应用标识', example: 'xiaolv' })
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'appKey 仅允许字母数字与 _ -',
  })
  appKey!: string;

  @ApiProperty({ description: '事件类型', enum: UPGRADE_EVENTS })
  @IsIn(UPGRADE_EVENTS)
  event!: UpgradeEvent;

  @ApiPropertyOptional({ description: '升级前版本号' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fromVersionCode?: number;

  @ApiPropertyOptional({ description: '目标版本号' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  toVersionCode?: number;

  @ApiPropertyOptional({ description: '失败原因码，仅失败事件携带' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  failCode?: string;

  @ApiPropertyOptional({ description: '网络类型 wifi/4g/5g 等' })
  @IsOptional()
  @IsString()
  @Length(1, 16)
  networkType?: string;

  @ApiPropertyOptional({ description: '系统版本' })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  osVersion?: string;

  @ApiPropertyOptional({ description: '设备型号' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  deviceModel?: string;

  @ApiPropertyOptional({ description: '耗时（毫秒）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  costMs?: number;
}
