import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'newemail@example.com', minLength: 3 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  email?: string;

  @ApiPropertyOptional({ example: 'John Doe', minLength: 3 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;
}
