import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
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

    // Create Reservation
    try {
      const reservation = new this.reservationModel({
        event: eventId,
        user: userId,
        ticketCode: `${eventId}-${userId}-${Date.now()}`,
        status: ReservationStatus.CONFIRMED,
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

  // Check logic to filter by UserRole (Admin sees all, User sees own)
  // For now, let's implement retrieving ALL for Admin or filtered by User
  async findAll(userId: string, role: string) {
    if (role === 'admin') {
      return this.reservationModel
        .find()
        .populate('event')
        .populate('user', '-password');
    }
    return this.reservationModel
      .find({ user: userId } as any)
      .populate('event');
  }

  async findOne(id: string) {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('event');
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_id: number, _updateReservationDto: UpdateReservationDto) {
    // Reservations usually aren't updated, only cancelled.
    return `This action updates a #${String(_id)} reservation`;
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

  async generateTicketPdf(reservationId: string): Promise<Buffer> {
    const reservation = await this.reservationModel
      .findById(reservationId)
      .populate('event')
      .populate('user');
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
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
