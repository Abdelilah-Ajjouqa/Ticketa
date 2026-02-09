import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'updatedemail@gmail.com', minLength: 3 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  email?: string;

  @ApiPropertyOptional({ example: 'username', minLength: 3 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;
}
