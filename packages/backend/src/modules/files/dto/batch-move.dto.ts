import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class BatchMoveDto {
  @ApiProperty({ description: '资源根目录 ID' })
  @IsString()
  @IsNotEmpty()
  rootId!: string;

  @ApiProperty({ description: '当前分类目录名' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ description: '待移动文件相对路径列表', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsString({ each: true })
  paths!: string[];

  @ApiProperty({ description: '目标分类目录名' })
  @IsString()
  @IsNotEmpty()
  targetCategory!: string;
}
