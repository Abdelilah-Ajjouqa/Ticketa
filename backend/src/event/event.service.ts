import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from './schema/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { AuthenticatedUser } from 'src/common/interfaces/auth.interface';
import { Reservation } from 'src/reservation/schema/reservation.schema';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
  ) {}

  async create(createEventDto: CreateEventDto, user: AuthenticatedUser) {
    const duplicate = await this.eventModel.findOne({
      title: createEventDto.title,
      description: createEventDto.description,
      date: new Date(createEventDto.date),
      location: createEventDto.location,
      totalTickets: createEventDto.totalTickets,
      price: createEventDto.price,
    });

    if (duplicate) {
      throw new ConflictException(
        'An event with the exact same details already exists',
      );
    }

    const newEvent = new this.eventModel({
      ...createEventDto,
      availableTickets: createEventDto.totalTickets,
      createdBy: user.userId,
    });
    return newEvent.save();
  }

  async findAll(isAdmin: boolean = false) {
    const filter = isAdmin ? {} : { status: EventStatus.PUBLISHED };
    return this.eventModel
      .find(filter)
      .populate('createdBy', 'username email')
      .sort({ date: 1 });
  }

  async findOne(id: string, isAdmin: boolean = false) {
    const event = await this.eventModel
      .findById(id)
      .populate('createdBy', 'username email');
    if (!event) throw new NotFoundException('Event not found');

    if (!isAdmin && event.status !== EventStatus.PUBLISHED) {
      throw new NotFoundException('Event not found or not published');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const event = await this.eventModel.findByIdAndUpdate(id, updateEventDto, {
      new: true,
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async publish(id: string) {
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException('Event not found');

    event.status = EventStatus.PUBLISHED;
    return event.save();
  }

  async cancel(id: string) {
    const event = await this.eventModel.findById(id);
    if (!event) throw new NotFoundException('Event not found');

    event.status = EventStatus.CANCELED;
    return event.save();
  }

  async remove(id: string) {
    const event = await this.eventModel.findByIdAndDelete(id);
    if (!event) throw new NotFoundException('Event not found');
    return { message: 'Event deleted successfully' };
  }

  async getStats() {
    const now = new Date();

    // Event counts by status
    const eventsByStatus = await this.eventModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap: Record<string, number> = {};
    let totalEvents = 0;
    for (const s of eventsByStatus) {
      statusMap[s._id] = s.count;
      totalEvents += s.count;
    }

    // Upcoming published events
    const upcomingEvents = await this.eventModel.countDocuments({
      status: EventStatus.PUBLISHED,
      date: { $gte: now },
    });

    // Fill rate across published events
    const fillRateResult = await this.eventModel.aggregate([
      { $match: { status: EventStatus.PUBLISHED } },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: '$totalTickets' },
          availableTickets: { $sum: '$availableTickets' },
        },
      },
    ]);

    let fillRate = 0;
    if (fillRateResult.length > 0 && fillRateResult[0].totalTickets > 0) {
      const { totalTickets, availableTickets } = fillRateResult[0];
      fillRate = Math.round(((totalTickets - availableTickets) / totalTickets) * 10000) / 100;
    }

    // Reservation status distribution
    const reservationsByStatus = await this.reservationModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const reservationStatusMap: Record<string, number> = {};
    let totalReservations = 0;
    for (const r of reservationsByStatus) {
      reservationStatusMap[r._id] = r.count;
      totalReservations += r.count;
    }

    return {
      events: {
        total: totalEvents,
        byStatus: statusMap,
        upcoming: upcomingEvents,
        fillRate,
      },
      reservations: {
        total: totalReservations,
        byStatus: reservationStatusMap,
      },
    };
  }
}
