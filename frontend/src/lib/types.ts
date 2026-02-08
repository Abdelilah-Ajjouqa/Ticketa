export interface ApiUser {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'participant';
  createdAt: string;
  updatedAt: string;
}

export interface ApiEvent {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  totalTickets: number;
  availableTickets: number;
  price: number;
  status: 'draft' | 'published' | 'canceled';
  createdBy: string | ApiUser;
  createdAt: string;
  updatedAt: string;
}

export interface ApiReservation {
  _id: string;
  event: string | ApiEvent;
  user: string | ApiUser;
  status: 'pending' | 'confirmed' | 'refused' | 'cancelled';
  ticketCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventStats {
  totalEvents: number;
  eventsByStatus: Record<string, number>;
  upcomingEvents: number;
  fillRate: number;
  reservationsByStatus: Record<string, number>;
}
