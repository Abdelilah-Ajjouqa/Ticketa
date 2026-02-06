import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { getModelToken } from '@nestjs/mongoose';
import { Event } from './schema/event.schema';
import { NotFoundException } from '@nestjs/common';
import { EventStatus } from 'src/common/enums/event-status.enum';

describe('EventService', () => {
  let service: EventService;
  let eventModel: any;

  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Event',
    description: 'A test event',
    date: new Date('2026-03-01'),
    location: 'Test Venue',
    totalTickets: 100,
    availableTickets: 100,
    price: 50,
    status: EventStatus.DRAFT,
    createdBy: '507f1f77bcf86cd799439012',
    save: jest.fn(),
  };

  const mockEventModel = {
    constructor: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  function createMockModel() {
    const model: any = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockEvent, ...data }),
    }));
    Object.assign(model, mockEventModel);
    return model;
  }

  beforeEach(async () => {
    const mockModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: getModelToken(Event.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    eventModel = module.get(getModelToken(Event.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const createEventDto = {
        title: 'New Event',
        description: 'Desc',
        date: '2026-03-01',
        location: 'Venue',
        totalTickets: 100,
        price: 25,
      };
      const user = { userId: '507f1f77bcf86cd799439012' };

      const result = await service.create(createEventDto as any, user);

      expect(result).toHaveProperty('title', createEventDto.title);
      expect(result).toHaveProperty(
        'availableTickets',
        createEventDto.totalTickets,
      );
      expect(result).toHaveProperty('createdBy', user.userId);
    });
  });

  describe('findAll', () => {
    it('should return published events for non-admin', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockEvent]),
      };
      eventModel.find.mockReturnValue(mockChain);

      const result = await service.findAll(false);

      expect(eventModel.find).toHaveBeenCalledWith({
        status: EventStatus.PUBLISHED,
      });
      expect(result).toEqual([mockEvent]);
    });

    it('should return all events for admin', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockEvent]),
      };
      eventModel.find.mockReturnValue(mockChain);

      const result = await service.findAll(true);

      expect(eventModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('findOne', () => {
    it('should return a published event for non-admin', async () => {
      const publishedEvent = {
        ...mockEvent,
        status: EventStatus.PUBLISHED,
      };
      const mockChain = {
        populate: jest.fn().mockResolvedValue(publishedEvent),
      };
      eventModel.findById.mockReturnValue(mockChain);

      const result = await service.findOne(mockEvent._id, false);

      expect(result).toEqual(publishedEvent);
    });

    it('should return any event for admin', async () => {
      const mockChain = {
        populate: jest.fn().mockResolvedValue(mockEvent),
      };
      eventModel.findById.mockReturnValue(mockChain);

      const result = await service.findOne(mockEvent._id, true);

      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException if event not found', async () => {
      const mockChain = { populate: jest.fn().mockResolvedValue(null) };
      eventModel.findById.mockReturnValue(mockChain);

      await expect(service.findOne('nonexistent', false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if event not published for non-admin', async () => {
      const draftEvent = { ...mockEvent, status: EventStatus.DRAFT };
      const mockChain = { populate: jest.fn().mockResolvedValue(draftEvent) };
      eventModel.findById.mockReturnValue(mockChain);

      await expect(service.findOne(mockEvent._id, false)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the event', async () => {
      const updateDto = { title: 'Updated Title' };
      const updatedEvent = { ...mockEvent, ...updateDto };
      eventModel.findByIdAndUpdate.mockResolvedValue(updatedEvent);

      const result = await service.update(mockEvent._id, updateDto as any);

      expect(eventModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEvent._id,
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedEvent);
    });

    it('should throw NotFoundException if event not found', async () => {
      eventModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'X' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('should publish the event', async () => {
      const savedEvent = { ...mockEvent, status: EventStatus.PUBLISHED };
      const eventDoc = {
        ...mockEvent,
        save: jest.fn().mockResolvedValue(savedEvent),
      };
      eventModel.findById.mockResolvedValue(eventDoc);

      const result = await service.publish(mockEvent._id);

      expect(eventDoc.status).toBe(EventStatus.PUBLISHED);
      expect(eventDoc.save).toHaveBeenCalled();
      expect(result).toEqual(savedEvent);
    });

    it('should throw NotFoundException if event not found', async () => {
      eventModel.findById.mockResolvedValue(null);

      await expect(service.publish('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel the event', async () => {
      const savedEvent = { ...mockEvent, status: EventStatus.CANCELED };
      const eventDoc = {
        ...mockEvent,
        save: jest.fn().mockResolvedValue(savedEvent),
      };
      eventModel.findById.mockResolvedValue(eventDoc);

      const result = await service.cancel(mockEvent._id);

      expect(eventDoc.status).toBe(EventStatus.CANCELED);
      expect(eventDoc.save).toHaveBeenCalled();
      expect(result).toEqual(savedEvent);
    });

    it('should throw NotFoundException if event not found', async () => {
      eventModel.findById.mockResolvedValue(null);

      await expect(service.cancel('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete the event and return success message', async () => {
      eventModel.findByIdAndDelete.mockResolvedValue(mockEvent);

      const result = await service.remove(mockEvent._id);

      expect(eventModel.findByIdAndDelete).toHaveBeenCalledWith(mockEvent._id);
      expect(result).toEqual({ message: 'Event deleted successfully' });
    });

    it('should throw NotFoundException if event not found', async () => {
      eventModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
