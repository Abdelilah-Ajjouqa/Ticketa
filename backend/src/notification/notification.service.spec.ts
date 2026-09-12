import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'EMAIL_FROM') return 'Ticketa <no-reply@ticketa.local>';
        return defaultValue || null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendReservationConfirmed', () => {
    it('should dispatch confirmation email with PDF attachment', async () => {
      const data = {
        to: 'user@example.com',
        username: 'Attendee',
        eventTitle: 'Music Festival',
        eventDate: new Date('2026-12-01T18:00:00.000Z'),
        eventLocation: 'Main Arena',
        pdfBuffer: Buffer.from('FAKE_PDF'),
      };

      const result = await service.sendReservationConfirmed(data);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('message');
    });
  });

  describe('sendReservationRefused', () => {
    it('should dispatch refusal email', async () => {
      const data = {
        to: 'user@example.com',
        username: 'Attendee',
        eventTitle: 'Music Festival',
      };

      const result = await service.sendReservationRefused(data);
      expect(result).toBeDefined();
    });
  });

  describe('sendEventCancelled', () => {
    it('should dispatch event cancellation notice', async () => {
      const data = {
        to: 'user@example.com',
        username: 'Attendee',
        eventTitle: 'Music Festival',
      };

      const result = await service.sendEventCancelled(data);
      expect(result).toBeDefined();
    });
  });
});

