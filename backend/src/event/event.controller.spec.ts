import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventStatus } from '../common/enums/event-status.enum';

describe('EventController', () => {
  let controller: EventController;
  let eventService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    publish: jest.Mock;
    cancel: jest.Mock;
    remove: jest.Mock;
    getStats: jest.Mock;
  };

  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Tech Conference 2026',
    description: 'A great tech conference',
    date: new Date('2026-10-15T09:00:00.000Z'),
    location: 'San Francisco',
    totalTickets: 100,
    availableTickets: 100,
    price: 49.99,
    status: EventStatus.PUBLISHED,
  };

  beforeEach(async () => {
    eventService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      publish: jest.fn(),
      cancel: jest.fn(),
      remove: jest.fn(),
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [{ provide: EventService, useValue: eventService }],
    }).compile();

    controller = module.get<EventController>(EventController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create event with user info', async () => {
      const createDto = {
        title: 'New Event',
        description: 'Desc',
        date: '2026-10-15T09:00:00.000Z',
        location: 'Location',
        totalTickets: 50,
        price: 10,
      };
      const req = { user: { userId: 'admin1', role: 'admin' } } as any;
      eventService.create.mockResolvedValue(mockEvent);

      const result = await controller.create(createDto, req);

      expect(eventService.create).toHaveBeenCalledWith(createDto, req.user);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findAll', () => {
    it('should return published events for public', async () => {
      eventService.findAll.mockResolvedValue([mockEvent]);

      const result = await controller.findAll();

      expect(eventService.findAll).toHaveBeenCalledWith(false);
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('findAllAdmin', () => {
    it('should return all events for admin', async () => {
      eventService.findAll.mockResolvedValue([mockEvent]);

      const result = await controller.findAllAdmin();

      expect(eventService.findAll).toHaveBeenCalledWith(true);
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('getStats', () => {
    it('should return stats for admin', async () => {
      const stats = { events: { total: 10 }, reservations: { total: 50 } };
      eventService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats();

      expect(eventService.getStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });

  describe('findOne', () => {
    it('should return published event', async () => {
      eventService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne(mockEvent._id);

      expect(eventService.findOne).toHaveBeenCalledWith(mockEvent._id, false);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findOneAdmin', () => {
    it('should return any event for admin', async () => {
      eventService.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOneAdmin(mockEvent._id);

      expect(eventService.findOne).toHaveBeenCalledWith(mockEvent._id, true);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('update', () => {
    it('should update and return event', async () => {
      const updateDto = { title: 'Updated' };
      const updated = { ...mockEvent, title: 'Updated' };
      eventService.update.mockResolvedValue(updated);

      const result = await controller.update(mockEvent._id, updateDto);

      expect(eventService.update).toHaveBeenCalledWith(
        mockEvent._id,
        updateDto,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('publish', () => {
    it('should publish event', async () => {
      eventService.publish.mockResolvedValue(mockEvent);

      const result = await controller.publish(mockEvent._id);

      expect(eventService.publish).toHaveBeenCalledWith(mockEvent._id);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('cancel', () => {
    it('should cancel event', async () => {
      const canceled = { ...mockEvent, status: EventStatus.CANCELED };
      eventService.cancel.mockResolvedValue(canceled);

      const result = await controller.cancel(mockEvent._id);

      expect(eventService.cancel).toHaveBeenCalledWith(mockEvent._id);
      expect(result).toEqual(canceled);
    });
  });

  describe('remove', () => {
    it('should delete event', async () => {
      eventService.remove.mockResolvedValue({
        message: 'Event deleted successfully',
      });

      const result = await controller.remove(mockEvent._id);

      expect(eventService.remove).toHaveBeenCalledWith(mockEvent._id);
      expect(result).toEqual({ message: 'Event deleted successfully' });
    });
  });
});
