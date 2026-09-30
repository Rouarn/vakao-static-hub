import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: '当前密码' })
  @IsString()
  @Length(1, 64)
  oldPassword!: string;

  @ApiProperty({ description: '新密码（6~64 位）' })
  @IsString()
  @Length(6, 64)
  newPassword!: string;
}
