import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

/** 修改应用标识（重命名 software-update 根下的应用目录） */
export class RenameAppDto {
  @ApiProperty({
    description: '新的应用标识，将作为新的目录名（如 xiaolv）',
    example: 'xiaolv',
  })
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'newAppKey 仅允许字母数字与 _ -',
  })
  newAppKey!: string;
}
