export interface ReservationConfirmedNotification {
  to: string;
  username: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
  pdfBuffer: Buffer;
}

export interface ReservationRefusedNotification {
  to: string;
  username: string;
  eventTitle: string;
}

export interface EventCancelledNotification {
  to: string;
  username: string;
  eventTitle: string;
}

