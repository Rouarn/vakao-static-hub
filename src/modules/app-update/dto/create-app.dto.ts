import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

/** 新建应用（在 software-update 资源根下创建分类目录） */
export class CreateAppDto {
  @ApiProperty({
    description: '应用标识，将作为 software-update 根下的目录名（如 xiaolv）',
    example: 'xiaolv',
  })
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'appKey 仅允许字母数字与 _ -',
  })
  appKey!: string;
}
