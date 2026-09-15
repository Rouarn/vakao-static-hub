import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class ForceUpdateDto {
  @ApiProperty({ description: '是否强制更新（远程逃生开关）', example: false })
  @IsBoolean()
  forceUpdate!: boolean;

  @ApiPropertyOptional({
    description: '最低兼容版本号，低于此值按强更处理',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minVersionCode?: number;
}
