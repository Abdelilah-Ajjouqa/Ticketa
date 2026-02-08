import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from './reservation.service';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Reservation, ReservationStatus } from './schema/reservation.schema';
import { Event } from 'src/event/schema/event.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationModel: any;
  let eventModel: any;
  let connection: any;

  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Event',
    status: 'published',
    availableTickets: 10,
    totalTickets: 100,
  };

  const mockReservation = {
    _id: '607f1f77bcf86cd799439022',
    event: mockEvent._id,
    user: '507f1f77bcf86cd799439012',
    ticketCode: 'ticket-code-123',
    status: 'pending',
    save: jest.fn(),
  };

  beforeEach(async () => {
    reservationModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...mockReservation, ...data }),
    }));
    Object.assign(reservationModel, {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
    });

    eventModel = {
      findById: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn(),
    };

    connection = {
      startSession: jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getModelToken(Reservation.name),
          useValue: reservationModel,
        },
        { provide: getModelToken(Event.name), useValue: eventModel },
        { provide: getConnectionToken(), useValue: connection },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = { eventId: mockEvent._id };
    const userId = '507f1f77bcf86cd799439012';

    it('should create a reservation as PENDING when event is available', async () => {
      reservationModel.findOne.mockResolvedValue(null); // no duplicate
      eventModel.findOneAndUpdate.mockResolvedValue(mockEvent);

      const result = await service.create(createDto, userId);

      expect(reservationModel.findOne).toHaveBeenCalled();
      expect(eventModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: createDto.eventId,
          status: 'published',
          availableTickets: { $gt: 0 },
        },
        { $inc: { availableTickets: -1 } },
        { new: true },
      );
      expect(result).toHaveProperty('event', createDto.eventId);
      expect(result).toHaveProperty('user', userId);
      expect(result).toHaveProperty('status', ReservationStatus.PENDING);
    });

    it('should throw BadRequestException if user already has active reservation', async () => {
      reservationModel.findOne.mockResolvedValue(mockReservation); // duplicate found

      await expect(service.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto, userId)).rejects.toThrow(
        'You already have an active reservation for this event',
      );
    });

    it('should throw NotFoundException if event does not exist', async () => {
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
        status: 'draft',
        availableTickets: 10,
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no tickets available', async () => {
      reservationModel.findOne.mockResolvedValue(null);
      eventModel.findOneAndUpdate.mockResolvedValue(null);
      eventModel.findById.mockResolvedValue({
        ...mockEvent,
        status: 'published',
        availableTickets: 0,
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should rollback ticket decrement if reservation save fails', async () => {
      reservationModel.findOne.mockResolvedValue(null);
      eventModel.findOneAndUpdate.mockResolvedValue(mockEvent);

      reservationModel.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB error')),
      }));

      await expect(service.create(createDto, userId)).rejects.toThrow(
        'DB error',
      );
      expect(eventModel.updateOne).toHaveBeenCalledWith(
        { _id: createDto.eventId },
        { $inc: { availableTickets: 1 } },
      );
    });
  });

  describe('findAll', () => {
    it('should return all reservations for admin', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce([mockReservation]);
      reservationModel.find.mockReturnValue(mockChain);

      const result = await service.findAll('anyUserId', 'admin');

      expect(reservationModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual([mockReservation]);
    });

    it('should return only user reservations for non-admin', async () => {
      const mockChain = {
        populate: jest.fn().mockResolvedValue([mockReservation]),
      };
      reservationModel.find.mockReturnValue(mockChain);

      const userId = '507f1f77bcf86cd799439012';
      const result = await service.findAll(userId, 'participant');

      expect(reservationModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockReservation]);
    });

    it('should filter by eventId for admin', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce([mockReservation]);
      reservationModel.find.mockReturnValue(mockChain);

      await service.findAll('anyUserId', 'admin', { eventId: mockEvent._id });

      expect(reservationModel.find).toHaveBeenCalledWith({ event: mockEvent._id });
    });

    it('should filter by userId for admin', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce([mockReservation]);
      reservationModel.find.mockReturnValue(mockChain);

      await service.findAll('anyUserId', 'admin', { userId: '507f1f77bcf86cd799439012' });

      expect(reservationModel.find).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439012' });
    });

    it('should filter by status for admin', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce([mockReservation]);
      reservationModel.find.mockReturnValue(mockChain);

      await service.findAll('anyUserId', 'admin', { status: 'pending' });

      expect(reservationModel.find).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('should filter by eventId and status for participant', async () => {
      const mockChain = {
        populate: jest.fn().mockResolvedValue([mockReservation]),
      };
      reservationModel.find.mockReturnValue(mockChain);

      const userId = '507f1f77bcf86cd799439012';
      await service.findAll(userId, 'participant', { eventId: mockEvent._id, status: 'confirmed' });

      expect(reservationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ user: userId, event: mockEvent._id, status: 'confirmed' }),
      );
    });

    it('should ignore userId filter for participant (always uses own)', async () => {
      const mockChain = {
        populate: jest.fn().mockResolvedValue([mockReservation]),
      };
      reservationModel.find.mockReturnValue(mockChain);

      const userId = '507f1f77bcf86cd799439012';
      await service.findAll(userId, 'participant', { userId: 'someone-else' });

      expect(reservationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ user: userId }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a reservation by id', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
      };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(mockReservation);
      reservationModel.findById.mockReturnValue(mockChain);

      const result = await service.findOne(mockReservation._id);

      expect(reservationModel.findById).toHaveBeenCalledWith(mockReservation._id);
      expect(result).toEqual(mockReservation);
    });

    it('should throw NotFoundException if reservation not found', async () => {
      const mockChain = { populate: jest.fn().mockReturnThis() };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(null);
      reservationModel.findById.mockReturnValue(mockChain);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if participant tries to access another user reservation', async () => {
      const reservationWithUser = {
        ...mockReservation,
        user: { _id: '507f1f77bcf86cd799439012' },
      };
      const mockChain = { populate: jest.fn().mockReturnThis() };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(reservationWithUser);
      reservationModel.findById.mockReturnValue(mockChain);

      await expect(
        service.findOne(mockReservation._id, 'different-user', 'participant'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow admin to access any reservation', async () => {
      const reservationWithUser = {
        ...mockReservation,
        user: { _id: '507f1f77bcf86cd799439012' },
      };
      const mockChain = { populate: jest.fn().mockReturnThis() };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(reservationWithUser);
      reservationModel.findById.mockReturnValue(mockChain);

      const result = await service.findOne(mockReservation._id, 'different-user', 'admin');
      expect(result).toEqual(reservationWithUser);
    });
  });

  describe('confirm', () => {
    it('should confirm a PENDING reservation', async () => {
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        save: jest.fn().mockResolvedValue({ ...mockReservation, status: ReservationStatus.CONFIRMED }),
      };
      reservationModel.findById.mockResolvedValue(reservation);

      const result = await service.confirm(mockReservation._id);

      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
      expect(reservation.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if reservation not found', async () => {
      reservationModel.findById.mockResolvedValue(null);

      await expect(service.confirm('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reservation is not PENDING', async () => {
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };
      reservationModel.findById.mockResolvedValue(reservation);

      await expect(service.confirm(mockReservation._id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refuse', () => {
    it('should refuse a PENDING reservation and release ticket', async () => {
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        save: jest.fn().mockResolvedValue({ ...mockReservation, status: ReservationStatus.REFUSED }),
      };
      reservationModel.findById.mockResolvedValue(reservation);

      const result = await service.refuse(mockReservation._id);

      expect(eventModel.updateOne).toHaveBeenCalledWith(
        { _id: reservation.event },
        { $inc: { availableTickets: 1 } },
      );
      expect(reservation.status).toBe(ReservationStatus.REFUSED);
      expect(reservation.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if reservation not found', async () => {
      reservationModel.findById.mockResolvedValue(null);

      await expect(service.refuse('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reservation is not PENDING', async () => {
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };
      reservationModel.findById.mockResolvedValue(reservation);

      await expect(service.refuse(mockReservation._id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should cancel a reservation as admin', async () => {
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        user: { toString: () => '507f1f77bcf86cd799439012' },
        save: jest.fn().mockResolvedValue({
          ...mockReservation,
          status: 'cancelled',
        }),
      };
      reservationModel.findById.mockResolvedValue(reservation);

      const result = await service.remove(
        mockReservation._id,
        'differentUser',
        'admin',
      );

      expect(eventModel.updateOne).toHaveBeenCalledWith(
        { _id: reservation.event },
        { $inc: { availableTickets: 1 } },
      );
      expect(result).toHaveProperty('status', 'cancelled');
    });

    it('should cancel a reservation as the owner', async () => {
      const ownerId = '507f1f77bcf86cd799439012';
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        user: { toString: () => ownerId },
        save: jest.fn().mockResolvedValue({
          ...mockReservation,
          status: 'cancelled',
        }),
      };
      reservationModel.findById.mockResolvedValue(reservation);

      const result = await service.remove(
        mockReservation._id,
        ownerId,
        'participant',
      );

      expect(result).toHaveProperty('status', 'cancelled');
    });

    it('should throw NotFoundException if reservation not found', async () => {
      reservationModel.findById.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent', 'user', 'participant'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if non-owner non-admin tries to cancel', async () => {
      const reservation = {
        ...mockReservation,
        status: ReservationStatus.PENDING,
        user: { toString: () => '507f1f77bcf86cd799439012' },
      };
      reservationModel.findById.mockResolvedValue(reservation);

      await expect(
        service.remove(mockReservation._id, 'different-user', 'participant'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if reservation already cancelled', async () => {
      const reservation = {
        ...mockReservation,
        status: 'cancelled',
        user: { toString: () => '507f1f77bcf86cd799439012' },
      };
      reservationModel.findById.mockResolvedValue(reservation);

      await expect(
        service.remove(
          mockReservation._id,
          '507f1f77bcf86cd799439012',
          'admin',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
