import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class PublishVersionDto {
  @ApiProperty({
    description: '发布模式：full 全量 / gray 灰度',
    enum: ['full', 'gray'],
  })
  @IsIn(['full', 'gray'], { message: 'mode 仅支持 full 或 gray' })
  mode!: 'full' | 'gray';

  @ApiPropertyOptional({
    description: '灰度百分比 1~99，mode=gray 时必填',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  grayPercent?: number;
}
