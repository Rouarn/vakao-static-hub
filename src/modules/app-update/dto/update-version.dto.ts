import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateVersionDto {
  @ApiPropertyOptional({ description: '版本名', example: '1.0.1' })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, {
    message: 'versionName 仅允许字母数字与 . _ - 字符',
  })
  versionName?: string;

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
