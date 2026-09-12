import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  ReservationConfirmedNotification,
  ReservationRefusedNotification,
  EventCancelledNotification,
} from './interfaces/notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: Transporter;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const port = this.configService.get<number>('SMTP_PORT', 587);

    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') ||
      'Ticketa <no-reply@ticketa.local>';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Transporter initialized for ${host}:${port}`);
    } else {
      // Mock / JSON transport for development & test environments
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      this.logger.log(
        'No SMTP credentials provided. Using JSON/Mock transport (logs to console).',
      );
    }
  }

  async sendReservationConfirmed(data: ReservationConfirmedNotification) {
    const subject = `Reservation Confirmed: ${data.eventTitle}`;
    const formattedDate = new Date(data.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #6366f1;">Ticketa – Ticket Confirmed!</h2>
        <p>Hello <strong>${data.username}</strong>,</p>
        <p>Great news! Your reservation for <strong>${data.eventTitle}</strong> has been confirmed by the organizers.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">Event Details</h3>
          <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventTitle}</p>
          <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${data.eventLocation}</p>
        </div>

        <p>Your official ticket PDF is attached to this email. You can present it at the entrance.</p>
        <p>See you there!</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">This is an automated notification from Ticketa.</p>
      </div>
    `;

    try {
      const result = await this.transporter.sendMail({
        from: this.fromEmail,
        to: data.to,
        subject,
        html,
        attachments: [
          {
            filename: `ticket-${data.eventTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
            content: data.pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(
        `Confirmation email dispatched to ${data.to} with PDF ticket.`,
      );
      return result;
    } catch (err) {
      this.logger.error(
        `Failed to send confirmation email to ${data.to}:`,
        err,
      );
      return null;
    }
  }

  async sendReservationRefused(data: ReservationRefusedNotification) {
    const subject = `Reservation Update: ${data.eventTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #ef4444;">Ticketa – Reservation Update</h2>
        <p>Hello <strong>${data.username}</strong>,</p>
        <p>We regret to inform you that your reservation request for <strong>${data.eventTitle}</strong> could not be accepted at this time.</p>
        <p>Any held tickets have been released back to the event pool. You may browse other events or contact the organizer if you believe this was in error.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">This is an automated notification from Ticketa.</p>
      </div>
    `;

    try {
      const result = await this.transporter.sendMail({
        from: this.fromEmail,
        to: data.to,
        subject,
        html,
      });

      this.logger.log(`Refusal email dispatched to ${data.to}.`);
      return result;
    } catch (err) {
      this.logger.error(`Failed to send refusal email to ${data.to}:`, err);
      return null;
    }
  }

  async sendEventCancelled(data: EventCancelledNotification) {
    const subject = `Event CANCELED: ${data.eventTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #dc2626;">Ticketa – Event Canceled</h2>
        <p>Hello <strong>${data.username}</strong>,</p>
        <p>We are writing to let you know that <strong>${data.eventTitle}</strong> has been canceled by the organizer.</p>
        <p>Your reservation for this event has been updated accordingly. We apologize for any inconvenience caused.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">This is an automated notification from Ticketa.</p>
      </div>
    `;

    try {
      const result = await this.transporter.sendMail({
        from: this.fromEmail,
        to: data.to,
        subject,
        html,
      });

      this.logger.log(`Event cancellation notice dispatched to ${data.to}.`);
      return result;
    } catch (err) {
      this.logger.error(
        `Failed to send event cancellation email to ${data.to}:`,
        err,
      );
      return null;
    }
  }
}

