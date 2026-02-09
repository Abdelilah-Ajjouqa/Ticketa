import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Res,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiProduces } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import type { AuthenticatedRequest } from 'src/common/interfaces/auth.interface';

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  create(
    @Body() createReservationDto: CreateReservationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reservationService.create(
      createReservationDto,
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations (filtered by role)' })
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('eventId') eventId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.reservationService.findAll(req.user.userId, req.user.role, {
      eventId,
      userId,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single reservation by ID' })
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.reservationService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Confirm a reservation (Admin)' })
  confirm(@Param('id') id: string) {
    return this.reservationService.confirm(id);
  }

  @Patch(':id/refuse')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Refuse a reservation (Admin)' })
  refuse(@Param('id') id: string) {
    return this.reservationService.refuse(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/delete a reservation' })
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.reservationService.remove(id, req.user.userId, req.user.role);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download reservation ticket as PDF' })
  @ApiProduces('application/pdf')
  async downloadTicket(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const buffer = await this.reservationService.generateTicketPdf(
      id,
      req.user.userId,
      req.user.role,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=ticket-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
