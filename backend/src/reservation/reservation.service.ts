import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Reservation, ReservationStatus } from './schema/reservation.schema';
import { Model } from 'mongoose';
import { Event } from 'src/event/schema/event.schema';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { InjectConnection } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import PDFDocument from 'pdfkit';

interface PopulatedEvent {
  title: string;
  date: Date;
  location: string;
}

interface PopulatedUser {
  username: string;
  email: string;
}

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
    userId: string,
  ): Promise<Reservation> {
    const { eventId } = createReservationDto;

    // Check for duplicate active reservation (not cancelled/refused)
    const existingReservation = await this.reservationModel.findOne({
      event: eventId,
      user: userId,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
    } as any);
    if (existingReservation) {
      throw new BadRequestException('You already have an active reservation for this event');
    }

    const updatedEvent = await this.eventModel.findOneAndUpdate(
      {
        _id: eventId,
        status: 'published',
        availableTickets: { $gt: 0 },
      },
      { $inc: { availableTickets: -1 } },
      { new: true },
    );

    if (!updatedEvent) {
      const event = await this.eventModel.findById(eventId);
      if (!event) throw new NotFoundException('Event not found');
      if (event.status !== EventStatus.PUBLISHED)
        throw new BadRequestException('Event is not published');
      if (event.availableTickets <= 0)
        throw new BadRequestException('No tickets available');
    }

    // Create Reservation as PENDING
    try {
      const reservation = new this.reservationModel({
        event: eventId,
        user: userId,
        ticketCode: `${eventId}-${userId}-${Date.now()}`,
        status: ReservationStatus.PENDING,
      });
      return await reservation.save();
    } catch (error) {
      await this.eventModel.updateOne(
        { _id: eventId },
        { $inc: { availableTickets: 1 } },
      );
      throw error;
    }
  }

  async findAll(
    userId: string,
    role: string,
    filters?: { eventId?: string; userId?: string; status?: string },
  ) {
    const query: Record<string, any> = {};

    if (role === 'admin') {
      // Admin can filter by eventId, userId, status
      if (filters?.eventId) query.event = filters.eventId;
      if (filters?.userId) query.user = filters.userId;
      if (filters?.status) query.status = filters.status;

      return this.reservationModel
        .find(query)
        .populate('event')
        .populate('user', '-password');
    }

    // Participants always see only their own, optionally filtered by event/status
    query.user = userId;
    if (filters?.eventId) query.event = filters.eventId;
    if (filters?.status) query.status = filters.status;

    return this.reservationModel
      .find(query as any)
      .populate('event');
  }

  async findOne(id: string, userId?: string, role?: string) {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('event')
      .populate('user', '-password');
    if (!reservation) throw new NotFoundException('Reservation not found');

    // Ownership check: participants can only see their own reservations
    if (role && role !== 'admin' && userId && String((reservation.user as any)._id || reservation.user) !== userId) {
      throw new BadRequestException('You cannot access this reservation');
    }

    return reservation;
  }

  async confirm(id: string) {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot confirm a reservation with status: ${reservation.status}`,
      );
    }

    reservation.status = ReservationStatus.CONFIRMED;
    return reservation.save();
  }

  async refuse(id: string) {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot refuse a reservation with status: ${reservation.status}`,
      );
    }

    // Release the ticket back
    await this.eventModel.updateOne(
      { _id: reservation.event },
      { $inc: { availableTickets: 1 } },
    );

    reservation.status = ReservationStatus.REFUSED;
    return reservation.save();
  }

  async remove(id: string, userId: string, role: string) {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) throw new NotFoundException('Reservation not found');

    // Only Admin or the owner can cancel
    if (
      role !== 'admin' &&
      String(reservation.user) !== userId
    ) {
      throw new BadRequestException('You cannot cancel this reservation');
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation already cancelled');
    }

    // Atomic release of ticket
    await this.eventModel.updateOne(
      { _id: reservation.event },
      { $inc: { availableTickets: 1 } },
    );

    reservation.status = ReservationStatus.CANCELLED;
    return reservation.save();
  }

  async generateTicketPdf(reservationId: string, userId?: string, role?: string): Promise<Buffer> {
    const reservation = await this.reservationModel
      .findById(reservationId)
      .populate('event')
      .populate('user', '-password');
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Ownership check
    if (role && role !== 'admin' && userId && String((reservation.user as any)._id || reservation.user) !== userId) {
      throw new BadRequestException('You cannot access this reservation');
    }

    // Only CONFIRMED reservations can generate PDF
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        'Ticket can only be downloaded for confirmed reservations',
      );
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => {});

    // Header
    doc.fontSize(25).text('Ticketa Application', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text('Event Ticket', { align: 'center' });
    doc.moveDown();

    // Event Details
    const event = reservation.event as unknown as PopulatedEvent;
    doc.fontSize(14).text(`Event: ${event.title}`);
    doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`);
    doc.text(`Location: ${event.location}`);
    doc.moveDown();

    // User Details
    const user = reservation.user as unknown as PopulatedUser;
    doc.text(`Attendee: ${user.username} (${user.email})`);
    doc.moveDown();

    // Ticket Code
    doc
      .fontSize(16)
      .fillColor('blue')
      .text(`Ticket Code: ${reservation.ticketCode}`, { align: 'center' });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
    });
  }
}
