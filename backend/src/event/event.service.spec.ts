import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventService } from './event.service';
import { Event } from './schema/event.schema';
import { Reservation } from '../reservation/schema/reservation.schema';
import { EventStatus } from '../common/enums/event-status.enum';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('EventService', () => {
  let service: EventService;
  let eventModel: any;
  let reservationModel: any;

  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Tech Conference 2026',
    description: 'A great tech conference',
    date: new Date('2026-10-15T09:00:00.000Z'),
    location: 'San Francisco',
    totalTickets: 100,
    availableTickets: 100,
    price: 49.99,
    status: EventStatus.DRAFT,
    createdBy: '507f1f77bcf86cd799439012',
    save: jest.fn(),
  };

  beforeEach(async () => {
    function MockModel(this: any, dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockResolvedValue({ ...mockEvent, ...dto });
    }
    MockModel.findOne = jest.fn();
    MockModel.find = jest.fn();
    MockModel.findById = jest.fn();
    MockModel.findByIdAndUpdate = jest.fn();
    MockModel.findByIdAndDelete = jest.fn();
    MockModel.aggregate = jest.fn();
    MockModel.countDocuments = jest.fn();

    const mockReservationModel = {
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: getModelToken(Event.name), useValue: MockModel },
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    eventModel = module.get(getModelToken(Event.name));
    reservationModel = module.get(getModelToken(Reservation.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      title: 'Tech Conference 2026',
      description: 'A great tech conference',
      date: '2026-10-15T09:00:00.000Z',
      location: 'San Francisco',
      totalTickets: 100,
      price: 49.99,
    };
    const user = { userId: '507f1f77bcf86cd799439012', role: 'admin' } as any;

    it('should create an event successfully when no duplicate exists', async () => {
      eventModel.findOne.mockResolvedValue(null);

      const result = await service.create(createDto, user);

      expect(eventModel.findOne).toHaveBeenCalledWith({
        title: createDto.title,
        description: createDto.description,
        date: new Date(createDto.date),
        location: createDto.location,
        totalTickets: createDto.totalTickets,
        price: createDto.price,
      });
      expect(result).toHaveProperty('title', createDto.title);
      expect(result).toHaveProperty('availableTickets', createDto.totalTickets);
      expect(result).toHaveProperty('createdBy', user.userId);
    });

    it('should throw ConflictException if duplicate event exists', async () => {
      eventModel.findOne.mockResolvedValue(mockEvent);

      await expect(service.create(createDto, user)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return published events only for non-admin', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockEvent]),
      };
      eventModel.find.mockReturnValue(mockQuery);

      const result = await service.findAll(false);

      expect(eventModel.find).toHaveBeenCalledWith({
        status: EventStatus.PUBLISHED,
      });
      expect(mockQuery.populate).toHaveBeenCalledWith(
        'createdBy',
        'username email',
      );
      expect(mockQuery.sort).toHaveBeenCalledWith({ date: 1 });
      expect(result).toEqual([mockEvent]);
    });

    it('should return all events for admin', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockEvent]),
      };
      eventModel.find.mockReturnValue(mockQuery);

      const result = await service.findAll(true);

      expect(eventModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('findOne', () => {
    it('should return published event for non-admin', async () => {
      const publishedEvent = { ...mockEvent, status: EventStatus.PUBLISHED };
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(publishedEvent),
      };
      eventModel.findById.mockReturnValue(mockQuery);

      const result = await service.findOne(mockEvent._id, false);

      expect(result).toEqual(publishedEvent);
    });

    it('should throw NotFoundException if event not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(null),
      };
      eventModel.findById.mockReturnValue(mockQuery);

      await expect(service.findOne('invalid-id', false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if event is draft for non-admin', async () => {
      const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(draftEvent),
      };
      eventModel.findById.mockReturnValue(mockQuery);

      await expect(service.findOne(mockEvent._id, false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return draft event for admin', async () => {
      const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
      const mockQuery = {
        populate: jest.fn().mockResolvedValue(draftEvent),
      };
      eventModel.findById.mockReturnValue(mockQuery);

      const result = await service.findOne(mockEvent._id, true);

      expect(result).toEqual(draftEvent);
    });
  });

  describe('update', () => {
    it('should update event when found', async () => {
      const updateDto = { title: 'Updated Title' };
      const updated = { ...mockEvent, ...updateDto };
      eventModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.update(mockEvent._id, updateDto);

      expect(eventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id,
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if event not found', async () => {
      eventModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('should publish event and save', async () => {
      const eventDoc = {
        ...mockEvent,
        status: EventStatus.DRAFT,
        save: jest.fn().mockResolvedValue({
          ...mockEvent,
          status: EventStatus.PUBLISHED,
        }),
      };
      eventModel.findById.mockResolvedValue(eventDoc);

      const result = await service.publish(mockEvent._id);

      expect(eventDoc.status).toBe(EventStatus.PUBLISHED);
      expect(eventDoc.save).toHaveBeenCalled();
      expect(result.status).toBe(EventStatus.PUBLISHED);
    });

    it('should throw NotFoundException if event not found', async () => {
      eventModel.findById.mockResolvedValue(null);

      await expect(service.publish('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel event and save', async () => {
      const eventDoc = {
        ...mockEvent,
        status: EventStatus.PUBLISHED,
        save: jest.fn().mockResolvedValue({
          ...mockEvent,
          status: EventStatus.CANCELED,
        }),
      };
      eventModel.findById.mockResolvedValue(eventDoc);

      const result = await service.cancel(mockEvent._id);

      expect(eventDoc.status).toBe(EventStatus.CANCELED);
      expect(eventDoc.save).toHaveBeenCalled();
      expect(result.status).toBe(EventStatus.CANCELED);
    });

    it('should throw NotFoundException if event not found', async () => {
      eventModel.findById.mockResolvedValue(null);

      await expect(service.cancel('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete event when found', async () => {
      eventModel.findByIdAndDelete.mockResolvedValue(mockEvent);

      const result = await service.remove(mockEvent._id);

      expect(eventModel.findByIdAndDelete).toHaveBeenCalledWith(mockEvent._id);
      expect(result).toEqual({ message: 'Event deleted successfully' });
    });

    it('should throw NotFoundException if event not found', async () => {
      eventModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStats', () => {
    it('should calculate and return platform stats', async () => {
      eventModel.aggregate
        .mockResolvedValueOnce([
          { _id: 'published', count: 5 },
          { _id: 'draft', count: 2 },
        ])
        .mockResolvedValueOnce([
          { _id: null, totalTickets: 200, availableTickets: 50 },
        ]);

      eventModel.countDocuments.mockResolvedValue(4);

      reservationModel.aggregate.mockResolvedValueOnce([
        { _id: 'confirmed', count: 120 },
        { _id: 'pending', count: 30 },
      ]);

      const stats = await service.getStats();

      expect(stats.events.total).toBe(7);
      expect(stats.events.upcoming).toBe(4);
      expect(stats.events.fillRate).toBe(75);
      expect(stats.events.byStatus).toEqual({ published: 5, draft: 2 });
      expect(stats.reservations.total).toBe(150);
      expect(stats.reservations.byStatus).toEqual({
        confirmed: 120,
        pending: 30,
      });
    });
  });
});
