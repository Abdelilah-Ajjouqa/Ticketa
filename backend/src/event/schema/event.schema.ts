import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { User } from 'src/user/schema/user.schema';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, min: 1 })
  totalTickets: number;

  @Prop({ required: true, min: 0 })
  availableTickets: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({
    required: true,
    enum: EventStatus,
    default: EventStatus.DRAFT,
    type: String,
  })
  status: EventStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: User;
}

export const EventSchema = SchemaFactory.createForClass(Event);
