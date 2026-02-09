import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@gmail.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;

  @ApiProperty({ example: 'username' })
  username: string;

  @ApiProperty({ example: 'password123' })
  confirmPassword: string;
}
