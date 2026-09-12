import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { ReservationService } from './reservation.service';
import { Reservation, ReservationStatus } from './schema/reservation.schema';
import { Event } from '../event/schema/event.schema';
import { EventStatus } from '../common/enums/event-status.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationModel: any;
  let eventModel: any;

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    username: 'attendee',
    email: 'attendee@example.com',
  };

  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Rock Concert',
    date: new Date('2026-11-20T20:00:00.000Z'),
    location: 'Concert Hall',
    totalTickets: 100,
    availableTickets: 50,
    status: EventStatus.PUBLISHED,
  };

  const mockReservation = {
    _id: '507f1f77bcf86cd799439013',
    event: mockEvent,
    user: mockUser,
    status: ReservationStatus.PENDING,
    save: jest.fn(),
  };

  beforeEach(async () => {
    function MockReservationModel(this: any, dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockResolvedValue({ ...mockReservation, ...dto });
    }
    MockReservationModel.findOne = jest.fn();
    MockReservationModel.find = jest.fn();
    MockReservationModel.findById = jest.fn();

    const mockEventModel = {
      findOneAndUpdate: jest.fn(),
      findById: jest.fn(),
      updateOne: jest.fn(),
    };

    const mockConnection = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getModelToken(Reservation.name),
          useValue: MockReservationModel,
        },
        { provide: getModelToken(Event.name), useValue: mockEventModel },
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    reservationModel = module.get(getModelToken(Reservation.name));
    eventModel = module.get(getModelToken(Event.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = { eventId: mockEvent._id };
    const userId = mockUser._id;

    it('should create reservation and decrement availableTickets', async () => {
      reservationModel.findOne.mockResolvedValue(null);
      eventModel.findOneAndUpdate.mockResolvedValue({
        ...mockEvent,
        availableTickets: 49,
      });

      const result = await service.create(createDto, userId);

      expect(reservationModel.findOne).toHaveBeenCalled();
      expect(eventModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: mockEvent._id,
          status: 'published',
          availableTickets: { $gt: 0 },
        },
        { $inc: { availableTickets: -1 } },
        { new: true },
      );
      expect(result).toHaveProperty('status', ReservationStatus.PENDING);
    });

    it('should throw BadRequestException if user already has active reservation', async () => {
      reservationModel.findOne.mockResolvedValue(mockReservation);

      await expect(service.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if event does not exist during ticket booking', async () => {
      reservationModel.findOne.mockResolvedValue(null);
      eventModel.findOneAndUpdate.mockResolvedValue(null);
      eventModel.findById.mockResolvedValue(null);

      await expect(service.create(createDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if event is not published', async () => {
      reservationModel.findOne.mockResolvedValue(null);
      eventModel.findOneAndUpdate.mockResolvedValue(null);
      eventModel.findById.mockResolvedValue({
        ...mockEvent,
        status: EventStatus.DRAFT,
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if event has no tickets left', async () => {
      reservationModel.findOne.mockResolvedValue(null);
      eventModel.findOneAndUpdate.mockResolvedValue(null);
      eventModel.findById.mockResolvedValue({
        ...mockEvent,
        availableTickets: 0,
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all populated reservations for admin', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce([mockReservation]);
      reservationModel.find.mockReturnValue(mockQuery);

      const result = await service.findAll(mockUser._id, 'admin', {
        status: 'pending',
      });

      expect(reservationModel.find).toHaveBeenCalledWith({ status: 'pending' });
      expect(result).toEqual([mockReservation]);
    });

    it('should restrict reservations to own user for participant', async () => {
      const mockQuery = {
        populate: jest.fn().mockResolvedValue([mockReservation]),
      };
      reservationModel.find.mockReturnValue(mockQuery);

      const result = await service.findAll(mockUser._id, 'participant');

      expect(reservationModel.find).toHaveBeenCalledWith({
        user: mockUser._id,
      });
      expect(result).toEqual([mockReservation]);
    });
  });

  describe('findOne', () => {
    it('should find reservation for admin', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(mockReservation);
      reservationModel.findById.mockReturnValue(mockQuery);

      const result = await service.findOne(
        mockReservation._id,
        'other-admin-id',
        'admin',
      );

      expect(result).toEqual(mockReservation);
    });

    it('should throw BadRequestException if participant tries to view other reservation', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(mockReservation);
      reservationModel.findById.mockReturnValue(mockQuery);

      await expect(
        service.findOne(
          mockReservation._id,
          'different-user-id',
          'participant',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(null);
      reservationModel.findById.mockReturnValue(mockQuery);

      await expect(
        service.findOne('invalid-id', mockUser._id, 'participant'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirm', () => {
    it('should confirm a pending reservation', async () => {
      const resDoc = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        save: jest.fn().mockResolvedValue({
          ...mockReservation,
          status: ReservationStatus.CONFIRMED,
        }),
      };
      reservationModel.findById.mockResolvedValue(resDoc);

      const result = await service.confirm(mockReservation._id);

      expect(resDoc.status).toBe(ReservationStatus.CONFIRMED);
      expect(resDoc.save).toHaveBeenCalled();
      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('should throw BadRequestException if reservation is not pending', async () => {
      const resDoc = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };
      reservationModel.findById.mockResolvedValue(resDoc);

      await expect(service.confirm(mockReservation._id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refuse', () => {
    it('should refuse pending reservation and increment availableTickets', async () => {
      const resDoc = {
        ...mockReservation,
        event: mockEvent._id,
        status: ReservationStatus.PENDING,
        save: jest.fn().mockResolvedValue({
          ...mockReservation,
          status: ReservationStatus.REFUSED,
        }),
      };
      reservationModel.findById.mockResolvedValue(resDoc);
      eventModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.refuse(mockReservation._id);

      expect(eventModel.updateOne).toHaveBeenCalledWith(
        { _id: mockEvent._id },
        { $inc: { availableTickets: 1 } },
      );
      expect(resDoc.status).toBe(ReservationStatus.REFUSED);
      expect(result.status).toBe(ReservationStatus.REFUSED);
    });

    it('should throw BadRequestException if reservation is not pending', async () => {
      const resDoc = {
        ...mockReservation,
        status: ReservationStatus.REFUSED,
      };
      reservationModel.findById.mockResolvedValue(resDoc);

      await expect(service.refuse(mockReservation._id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should cancel reservation and return ticket', async () => {
      const resDoc = {
        ...mockReservation,
        user: mockUser._id,
        event: mockEvent._id,
        status: ReservationStatus.PENDING,
        save: jest.fn().mockResolvedValue({
          ...mockReservation,
          status: ReservationStatus.CANCELLED,
        }),
      };
      reservationModel.findById.mockResolvedValue(resDoc);
      eventModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await service.remove(
        mockReservation._id,
        mockUser._id,
        'participant',
      );

      expect(eventModel.updateOne).toHaveBeenCalledWith(
        { _id: mockEvent._id },
        { $inc: { availableTickets: 1 } },
      );
      expect(resDoc.status).toBe(ReservationStatus.CANCELLED);
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('should throw BadRequestException if user is not owner and not admin', async () => {
      const resDoc = {
        ...mockReservation,
        user: 'other-user',
      };
      reservationModel.findById.mockResolvedValue(resDoc);

      await expect(
        service.remove(mockReservation._id, mockUser._id, 'participant'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if reservation is already cancelled', async () => {
      const resDoc = {
        ...mockReservation,
        user: mockUser._id,
        status: ReservationStatus.CANCELLED,
      };
      reservationModel.findById.mockResolvedValue(resDoc);

      await expect(
        service.remove(mockReservation._id, mockUser._id, 'participant'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateTicketPdf', () => {
    it('should generate PDF buffer for confirmed reservation', async () => {
      const confirmedReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(confirmedReservation);
      reservationModel.findById.mockReturnValue(mockQuery);

      const buffer = await service.generateTicketPdf(
        mockReservation._id,
        mockUser._id,
        'participant',
      );

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should throw BadRequestException if reservation is not confirmed', async () => {
      const pendingReservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
      };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
      };
      mockQuery.populate
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce(pendingReservation);
      reservationModel.findById.mockReturnValue(mockQuery);

      await expect(
        service.generateTicketPdf(
          mockReservation._id,
          mockUser._id,
          'participant',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
