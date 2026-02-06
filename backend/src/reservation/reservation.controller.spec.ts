import { Test, TestingModule } from '@nestjs/testing';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';

describe('ReservationController', () => {
  let controller: ReservationController;
  let reservationService: jest.Mocked<Partial<ReservationService>>;

  const mockReservation = {
    _id: '607f1f77bcf86cd799439022',
    event: '507f1f77bcf86cd799439011',
    user: '507f1f77bcf86cd799439012',
    ticketCode: 'ticket-123',
    status: 'confirmed',
  };

  beforeEach(async () => {
    reservationService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
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
      const req = { user: { userId: 'user1', role: 'participant' } };
      reservationService.create.mockResolvedValue(mockReservation as any);

      const result = await controller.create(dto, req);

      expect(reservationService.create).toHaveBeenCalledWith(dto, 'user1');
      expect(result).toEqual(mockReservation);
    });
  });

  describe('findAll', () => {
    it('should return all reservations for the user', async () => {
      const req = { user: { userId: 'user1', role: 'participant' } };
      reservationService.findAll.mockResolvedValue([mockReservation] as any);

      const result = await controller.findAll(req);

      expect(reservationService.findAll).toHaveBeenCalledWith(
        'user1',
        'participant',
      );
      expect(result).toEqual([mockReservation]);
    });
  });

  describe('findOne', () => {
    it('should return a reservation by id', async () => {
      reservationService.findOne.mockResolvedValue(mockReservation as any);

      const result = await controller.findOne(mockReservation._id);

      expect(reservationService.findOne).toHaveBeenCalledWith(
        mockReservation._id,
      );
      expect(result).toEqual(mockReservation);
    });
  });

  describe('update', () => {
    it('should call update with correct params', () => {
      const dto = {};
      reservationService.update.mockReturnValue(
        'This action updates a #1 reservation' as any,
      );

      const result = controller.update('1', dto as any);

      expect(reservationService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe('This action updates a #1 reservation');
    });
  });

  describe('remove', () => {
    it('should remove a reservation', async () => {
      const req = { user: { userId: 'user1', role: 'participant' } };
      const cancelled = { ...mockReservation, status: 'cancelled' };
      reservationService.remove.mockResolvedValue(cancelled as any);

      const result = await controller.remove(mockReservation._id, req);

      expect(reservationService.remove).toHaveBeenCalledWith(
        mockReservation._id,
        'user1',
        'participant',
      );
      expect(result).toEqual(cancelled);
    });
  });

  describe('downloadTicket', () => {
    it('should send the PDF buffer as a response', async () => {
      const pdfBuffer = Buffer.from('fake-pdf-content');
      reservationService.generateTicketPdf.mockResolvedValue(pdfBuffer);

      const res = {
        set: jest.fn(),
        end: jest.fn(),
      } as any;

      await controller.downloadTicket(mockReservation._id, res);

      expect(reservationService.generateTicketPdf).toHaveBeenCalledWith(
        mockReservation._id,
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
