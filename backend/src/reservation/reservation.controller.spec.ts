import { Test, TestingModule } from '@nestjs/testing';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';

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
    _id: '607f1f77bcf86cd799439022',
    event: '507f1f77bcf86cd799439011',
    user: '507f1f77bcf86cd799439012',
    ticketCode: 'ticket-123',
    status: 'pending',
  };

  const mockReq = { user: { userId: 'user1', role: 'participant', email: 'test@test.com', username: 'test' } };
  const mockAdminReq = { user: { userId: 'admin1', role: 'admin', email: 'admin@test.com', username: 'admin' } };

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

  describe('create', () => {
    it('should create a reservation', async () => {
      const dto = { eventId: '507f1f77bcf86cd799439011' };
      reservationService.create.mockResolvedValue(mockReservation as any);

      const result = await controller.create(dto, mockReq);

      expect(reservationService.create).toHaveBeenCalledWith(dto, 'user1');
      expect(result).toEqual(mockReservation);
    });
  });

  describe('findAll', () => {
    it('should return all reservations for the user', async () => {
      reservationService.findAll.mockResolvedValue([mockReservation] as any);

      const result = await controller.findAll(mockReq);

      expect(reservationService.findAll).toHaveBeenCalledWith('user1', 'participant', {
        eventId: undefined,
        userId: undefined,
        status: undefined,
      });
      expect(result).toEqual([mockReservation]);
    });

    it('should pass query filters to service', async () => {
      reservationService.findAll.mockResolvedValue([mockReservation] as any);

      const result = await controller.findAll(mockAdminReq, 'event123', 'user456', 'pending');

      expect(reservationService.findAll).toHaveBeenCalledWith('admin1', 'admin', {
        eventId: 'event123',
        userId: 'user456',
        status: 'pending',
      });
      expect(result).toEqual([mockReservation]);
    });
  });

  describe('findOne', () => {
    it('should return a reservation by id with ownership check', async () => {
      reservationService.findOne.mockResolvedValue(mockReservation as any);

      const result = await controller.findOne(mockReservation._id, mockReq);

      expect(reservationService.findOne).toHaveBeenCalledWith(mockReservation._id, 'user1', 'participant');
      expect(result).toEqual(mockReservation);
    });
  });

  describe('confirm', () => {
    it('should confirm a reservation (admin only)', async () => {
      const confirmed = { ...mockReservation, status: 'confirmed' };
      reservationService.confirm.mockResolvedValue(confirmed as any);

      const result = await controller.confirm(mockReservation._id);

      expect(reservationService.confirm).toHaveBeenCalledWith(mockReservation._id);
      expect(result).toEqual(confirmed);
    });
  });

  describe('refuse', () => {
    it('should refuse a reservation (admin only)', async () => {
      const refused = { ...mockReservation, status: 'refused' };
      reservationService.refuse.mockResolvedValue(refused as any);

      const result = await controller.refuse(mockReservation._id);

      expect(reservationService.refuse).toHaveBeenCalledWith(mockReservation._id);
      expect(result).toEqual(refused);
    });
  });

  describe('remove', () => {
    it('should remove a reservation', async () => {
      const cancelled = { ...mockReservation, status: 'cancelled' };
      reservationService.remove.mockResolvedValue(cancelled as any);

      const result = await controller.remove(mockReservation._id, mockReq);

      expect(reservationService.remove).toHaveBeenCalledWith(mockReservation._id, 'user1', 'participant');
      expect(result).toEqual(cancelled);
    });
  });

  describe('downloadTicket', () => {
    it('should send the PDF buffer as a response with ownership', async () => {
      const pdfBuffer = Buffer.from('fake-pdf-content');
      reservationService.generateTicketPdf.mockResolvedValue(pdfBuffer);

      const res = { set: jest.fn(), end: jest.fn() } as any;

      await controller.downloadTicket(mockReservation._id, mockReq, res);

      expect(reservationService.generateTicketPdf).toHaveBeenCalledWith(mockReservation._id, 'user1', 'participant');
      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=ticket-${mockReservation._id}.pdf`,
        'Content-Length': pdfBuffer.length,
      });
      expect(res.end).toHaveBeenCalledWith(pdfBuffer);
    });
  });
});
