import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** 灰度递增步骤：发布后 hours 小时将灰度扩大到 percent */
export class GrayIncrementStep {
  @ApiProperty({ description: '发布后经过的小时数', example: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hours!: number;

  @ApiProperty({ description: '目标灰度百分比 1~100', example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  percent!: number;
}

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

  @ApiPropertyOptional({
    description: '灰度自动递增开关，mode=gray 时可选',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  grayAutoIncrement?: boolean;

  @ApiPropertyOptional({
    description:
      '灰度递增时间表，开启自动递增时必填，如 [{ "hours": 24, "percent": 30 }, { "hours": 72, "percent": 100 }]',
    type: [GrayIncrementStep],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GrayIncrementStep)
  grayIncrementSchedule?: GrayIncrementStep[];
}
