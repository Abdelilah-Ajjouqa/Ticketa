import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Reservation } from './schema/reservation.schema';
import { Model } from 'mongoose';
import { Event } from 'src/event/schema/event.schema';
import { InjectConnection } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import PDFDocument = require('pdfkit');


@Injectable()
export class ReservationService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) { }

  async create(createReservationDto: CreateReservationDto, userId: string): Promise<Reservation> {
    const { eventId } = createReservationDto;

    const updatedEvent = await this.eventModel.findOneAndUpdate(
      {
        _id: eventId,
        status: 'published',
        availableTickets: { $gt: 0 }
      },
      { $inc: { availableTickets: -1 } },
      { new: true }
    );

    if (!updatedEvent) {
      const event = await this.eventModel.findById(eventId);
      if (!event) throw new NotFoundException('Event not found');
      if (event.status !== 'published') throw new BadRequestException('Event is not published');
      if (event.availableTickets <= 0) throw new BadRequestException('No tickets available');
    }

    // Create Reservation
    try {
      const reservation = new this.reservationModel({
        event: eventId,
        user: userId,
        ticketCode: `${eventId}-${userId}-${Date.now()}`,
        status: 'confirmed',
      });
      return await reservation.save();
    } catch (error) {
      await this.eventModel.updateOne({ _id: eventId }, { $inc: { availableTickets: 1 } });
      throw error;
    }
  }

  // Check logic to filter by UserRole (Admin sees all, User sees own)
  // For now, let's implement retrieving ALL for Admin or filtered by User
  async findAll(userId: string, role: string) {
    if (role === 'admin') {
      return this.reservationModel.find().populate('event').populate('user', '-password');
    }
    return this.reservationModel.find({ user: new mongoose.Types.ObjectId(userId) as any }).populate('event');
  }

  async findOne(id: string) {
    const reservation = await this.reservationModel.findById(id).populate('event');
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  update(id: number, updateReservationDto: UpdateReservationDto) {
    // Reservations usually aren't updated, only cancelled.
    return `This action updates a #${id} reservation`;
  }

  async remove(id: string, userId: string, role: string) {
    const reservation = await this.reservationModel.findById(id);
    if (!reservation) throw new NotFoundException('Reservation not found');

    // Only Admin or the owner can cancel
    if (role !== 'admin' && reservation.user.toString() !== userId) {
      throw new BadRequestException('You cannot cancel this reservation');
    }

    if (reservation.status === 'cancelled') {
      throw new BadRequestException('Reservation already cancelled');
    }

    // Atomic release of ticket
    await this.eventModel.updateOne(
      { _id: reservation.event },
      { $inc: { availableTickets: 1 } }
    );

    reservation.status = 'cancelled' as any; // Cast if enum type issue
    return reservation.save();
  }

  async generateTicketPdf(reservationId: string): Promise<Buffer> {
    const reservation = await this.reservationModel.findById(reservationId).populate('event').populate('user');
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => { });

    // Header
    doc.fontSize(25).text('Ticketa Application', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text('Event Ticket', { align: 'center' });
    doc.moveDown();

    // Event Details
    const event = reservation.event as any;
    doc.fontSize(14).text(`Event: ${event.title}`);
    doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`);
    doc.text(`Location: ${event.location}`);
    doc.moveDown();

    // User Details
    const user = reservation.user as any;
    doc.text(`Attendee: ${user.username} (${user.email})`);
    doc.moveDown();

    // Ticket Code
    doc.fontSize(16).fillColor('blue').text(`Ticket Code: ${reservation.ticketCode}`, { align: 'center' });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
    });
  }
}
