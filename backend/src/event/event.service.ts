import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from './schema/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus } from 'src/common/enums/event-status.enum';

@Injectable()
export class EventService {
  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) { }

  async create(createEventDto: CreateEventDto, user: any) {
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
}
