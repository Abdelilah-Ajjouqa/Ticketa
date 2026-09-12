import { Test, TestingModule } from '@nestjs/testing';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { ReservationStatus } from './schema/reservation.schema';

describe('ReservationController', () => {
  let controller: ReservationController;
  let reservationService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    confirm: jest.Mock;
    refuse: jest.Mock;
    remove: jest.Mock;
    generateTicketPdf: jest.Mock;
  };

  const mockReservation = {
    _id: '507f1f77bcf86cd799439013',
    event: '507f1f77bcf86cd799439011',
    user: '507f1f77bcf86cd799439012',
    status: ReservationStatus.PENDING,
  };

  beforeEach(async () => {
    reservationService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      confirm: jest.fn(),
      refuse: jest.fn(),
      remove: jest.fn(),
      generateTicketPdf: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationController],
      providers: [
        { provide: ReservationService, useValue: reservationService },
      ],
    }).compile();

    controller = module.get<ReservationController>(ReservationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create reservation with current user id', async () => {
      const createDto = { eventId: '507f1f77bcf86cd799439011' };
      const req = { user: { userId: '507f1f77bcf86cd799439012' } } as any;
      reservationService.create.mockResolvedValue(mockReservation);

      const result = await controller.create(createDto, req);

      expect(reservationService.create).toHaveBeenCalledWith(
        createDto,
        req.user.userId,
      );
      expect(result).toEqual(mockReservation);
    });
  });

  describe('findAll', () => {
    it('should pass user context and query filters to service', async () => {
      const req = {
        user: { userId: '507f1f77bcf86cd799439012', role: 'admin' },
      } as any;
      reservationService.findAll.mockResolvedValue([mockReservation]);

      const result = await controller.findAll(
        req,
        'event1',
        'user1',
        'confirmed',
      );

      expect(reservationService.findAll).toHaveBeenCalledWith(
        req.user.userId,
        req.user.role,
        { eventId: 'event1', userId: 'user1', status: 'confirmed' },
      );
      expect(result).toEqual([mockReservation]);
    });
  });

  describe('findOne', () => {
    it('should return reservation by id with access control', async () => {
      const req = {
        user: { userId: '507f1f77bcf86cd799439012', role: 'participant' },
      } as any;
      reservationService.findOne.mockResolvedValue(mockReservation);

      const result = await controller.findOne(mockReservation._id, req);

      expect(reservationService.findOne).toHaveBeenCalledWith(
        mockReservation._id,
        req.user.userId,
        req.user.role,
      );
      expect(result).toEqual(mockReservation);
    });
  });

  describe('confirm', () => {
    it('should confirm reservation', async () => {
      const confirmed = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };
      reservationService.confirm.mockResolvedValue(confirmed);

      const result = await controller.confirm(mockReservation._id);

      expect(reservationService.confirm).toHaveBeenCalledWith(
        mockReservation._id,
      );
      expect(result).toEqual(confirmed);
    });
  });

  describe('refuse', () => {
    it('should refuse reservation', async () => {
      const refused = { ...mockReservation, status: ReservationStatus.REFUSED };
      reservationService.refuse.mockResolvedValue(refused);

      const result = await controller.refuse(mockReservation._id);

      expect(reservationService.refuse).toHaveBeenCalledWith(
        mockReservation._id,
      );
      expect(result).toEqual(refused);
    });
  });

  describe('remove', () => {
    it('should cancel reservation', async () => {
      const req = {
        user: { userId: '507f1f77bcf86cd799439012', role: 'participant' },
      } as any;
      const cancelled = {
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      };
      reservationService.remove.mockResolvedValue(cancelled);

      const result = await controller.remove(mockReservation._id, req);

      expect(reservationService.remove).toHaveBeenCalledWith(
        mockReservation._id,
        req.user.userId,
        req.user.role,
      );
      expect(result).toEqual(cancelled);
    });
  });

  describe('downloadTicket', () => {
    it('should set headers and stream PDF buffer', async () => {
      const req = {
        user: { userId: '507f1f77bcf86cd799439012', role: 'participant' },
      } as any;
      const pdfBuffer = Buffer.from('PDF_CONTENT');
      reservationService.generateTicketPdf.mockResolvedValue(pdfBuffer);

      const res = {
        set: jest.fn(),
        end: jest.fn(),
      } as any;

      await controller.downloadTicket(mockReservation._id, req, res);

      expect(reservationService.generateTicketPdf).toHaveBeenCalledWith(
        mockReservation._id,
        req.user.userId,
        req.user.role,
      );
      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=ticket-${mockReservation._id}.pdf`,
        'Content-Length': pdfBuffer.length,
      });
      expect(res.end).toHaveBeenCalledWith(pdfBuffer);
    });
  });
});
