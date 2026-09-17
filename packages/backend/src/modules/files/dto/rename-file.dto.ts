/**
 * 重命名文件 DTO
 * 定义重命名文件的请求参数结构
 * 仅允许修改文件 basename，禁止携带路径段，防止路径穿越
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

/**
 * 重命名文件 DTO
 */
export class RenameFileDto {
  /** 新文件名（仅文件名，不能包含路径分隔符） */
  @ApiProperty({ description: '新文件名（仅文件名，不能包含路径分隔符）' })
  @IsString()
  @IsNotEmpty({ message: '文件名不能为空' })
  @MaxLength(255, { message: '文件名最长 255 个字符' })
  @Matches(/^[^\\/]+$/, {
    message: '文件名不能包含路径分隔符',
  })
  newName!: string;
}
