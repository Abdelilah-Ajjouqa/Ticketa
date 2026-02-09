import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from 'src/common/enums/event-status.enum';

export class CreateEventDto {
  @ApiProperty({ example: 'Music Festival 2026' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'An amazing outdoor music festival' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: '2026-06-15T18:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Central Park, New York' })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({ example: 500, minimum: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  totalTickets: number;

  @ApiProperty({ example: 49.99, minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ enum: EventStatus, example: EventStatus.DRAFT })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
