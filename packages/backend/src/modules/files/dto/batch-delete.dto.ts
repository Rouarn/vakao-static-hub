import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class BatchDeleteDto {
  @ApiProperty({ description: '资源根目录 ID' })
  @IsString()
  @IsNotEmpty()
  rootId!: string;

  @ApiProperty({ description: '分类目录名' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ description: '待删除文件相对路径列表', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsString({ each: true })
  paths!: string[];
}
