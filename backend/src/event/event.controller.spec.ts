import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from './event.service';

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
  };

  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Event',
    description: 'A test event',
    date: new Date('2026-03-01'),
    location: 'Test Venue',
    totalTickets: 100,
    availableTickets: 100,
    price: 50,
    status: 'draft',
    createdBy: '507f1f77bcf86cd799439012',
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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [{ provide: EventService, useValue: eventService }],
    }).compile();

    controller = module.get<EventController>(EventController);
  });

  describe('create', () => {
    it('should create an event', async () => {
      const dto = {
        title: 'New Event',
        description: 'Desc',
        date: '2026-03-01',
        location: 'Venue',
        totalTickets: 100,
        price: 25,
      };
      const req = { user: { userId: 'user1', role: 'admin' } };
      eventService.create.mockResolvedValue(mockEvent as any);

      const result = await controller.create(dto as any, req);

      expect(eventService.create).toHaveBeenCalledWith(dto, req.user);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findAll', () => {
    it('should return all published events', async () => {
      eventService.findAll.mockResolvedValue([mockEvent] as any);
      const req = { user: undefined };

      const result = await controller.findAll(req);

      expect(eventService.findAll).toHaveBeenCalledWith(false);
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('findAllAdmin', () => {
    it('should return all events for admin', async () => {
      eventService.findAll.mockResolvedValue([mockEvent] as any);

      const result = await controller.findAllAdmin();

      expect(eventService.findAll).toHaveBeenCalledWith(true);
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      eventService.findOne.mockResolvedValue(mockEvent as any);

      const result = await controller.findOne(mockEvent._id);

      expect(eventService.findOne).toHaveBeenCalledWith(mockEvent._id, false);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findOneAdmin', () => {
    it('should return a single event for admin', async () => {
      eventService.findOne.mockResolvedValue(mockEvent as any);

      const result = await controller.findOneAdmin(mockEvent._id);

      expect(eventService.findOne).toHaveBeenCalledWith(mockEvent._id, true);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('update', () => {
    it('should update the event', async () => {
      const updateDto = { title: 'Updated' };
      const updated = { ...mockEvent, ...updateDto };
      eventService.update.mockResolvedValue(updated as any);

      const result = await controller.update(mockEvent._id, updateDto as any);

      expect(eventService.update).toHaveBeenCalledWith(
        mockEvent._id,
        updateDto,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('publish', () => {
    it('should publish the event', async () => {
      const published = { ...mockEvent, status: 'published' };
      eventService.publish.mockResolvedValue(published as any);

      const result = await controller.publish(mockEvent._id);

      expect(eventService.publish).toHaveBeenCalledWith(mockEvent._id);
      expect(result).toEqual(published);
    });
  });

  describe('cancel', () => {
    it('should cancel the event', async () => {
      const cancelled = { ...mockEvent, status: 'canceled' };
      eventService.cancel.mockResolvedValue(cancelled as any);

      const result = await controller.cancel(mockEvent._id);

      expect(eventService.cancel).toHaveBeenCalledWith(mockEvent._id);
      expect(result).toEqual(cancelled);
    });
  });

  describe('remove', () => {
    it('should remove the event', async () => {
      eventService.remove.mockResolvedValue({
        message: 'Event deleted successfully',
      } as any);

      const result = await controller.remove(mockEvent._id);

      expect(eventService.remove).toHaveBeenCalledWith(mockEvent._id);
      expect(result).toEqual({ message: 'Event deleted successfully' });
    });
  });
});
