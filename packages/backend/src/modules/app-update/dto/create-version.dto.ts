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

export class CreateVersionDto {
  @ApiProperty({
    description: '应用标识（software-update 根下的分类目录名）',
    example: 'xiaolv',
  })
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'appKey 仅允许字母数字与 _ -',
  })
  appKey!: string;

  @ApiProperty({ description: '版本名，如 1.0.1', example: '1.0.1' })
  @IsString()
  @Length(1, 32)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, {
    message: 'versionName 仅允许字母数字与 . _ - 字符',
  })
  versionName!: string;

  @ApiProperty({
    description: '整数版本号，在该应用内必须大于线上全量版本',
    example: 101,
  })
  @Type(() => Number)
  @IsInt({ message: 'versionCode 必须为整数' })
  @Min(1)
  versionCode!: number;

  @ApiPropertyOptional({ description: '更新说明，支持换行' })
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  updateLog?: string;

  @ApiPropertyOptional({ description: '内部备注' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  remark?: string;
}
