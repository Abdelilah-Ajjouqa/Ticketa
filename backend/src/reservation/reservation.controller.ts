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
import type { Response } from 'express';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import type { AuthenticatedRequest } from 'src/common/interfaces/auth.interface';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
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
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.reservationService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.ADMIN)
  confirm(@Param('id') id: string) {
    return this.reservationService.confirm(id);
  }

  @Patch(':id/refuse')
  @Roles(UserRole.ADMIN)
  refuse(@Param('id') id: string) {
    return this.reservationService.refuse(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.reservationService.remove(id, req.user.userId, req.user.role);
  }

  @Get(':id/pdf')
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
