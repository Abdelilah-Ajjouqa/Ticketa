'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { getErrorMessage } from '@/lib/api';
import { useAppSelector } from '@/lib/hooks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  CalendarIcon,
  MapPinIcon,
  TicketIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import type { ApiEvent } from '@/lib/types';
import Link from 'next/link';

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
      } catch {
        setMessage({ type: 'error', text: 'Failed to load event details.' });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleBook = async () => {
    if (!user) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }
    if (!event) return;

    setBookingLoading(true);
    setMessage(null);
    try {
      await api.post('/reservations', { eventId: event._id });
      setMessage({
        type: 'success',
        text: 'Reservation created! Check your dashboard for status.',
      });
      setEvent({ ...event, availableTickets: event.availableTickets - 1 });
    } catch (err) {
      setMessage({
        type: 'error',
        text: getErrorMessage(err, 'Booking failed'),
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <LoadingSpinner className="min-h-[calc(100vh-64px)]" />;

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-light-muted">Event not found.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-accent hover:text-accent-hover text-sm font-medium"
        >
          &larr; Back to events
        </Link>
      </div>
    );
  }

  const isSoldOut = event.availableTickets <= 0;
  const ticketPercent = Math.round(
    ((event.totalTickets - event.availableTickets) / event.totalTickets) * 100
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-light-muted hover:text-light mb-6 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to events
      </Link>

      <div className="bg-dark-secondary rounded-xl border border-border-strong shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-dark-primary via-dark-secondary to-dark-primary px-6 py-8 border-b border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-accent/5" />
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold text-light">{event.title}</h1>
            <p className="mt-2 text-light-muted text-sm sm:text-base">{event.description}</p>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-dark-primary/60 rounded-lg border border-border">
              <CalendarIcon className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-xs font-medium text-light-muted uppercase">Date & Time</p>
                <p className="text-sm font-medium text-light mt-0.5">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-light-muted">
                  {new Date(event.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-dark-primary/60 rounded-lg border border-border">
              <MapPinIcon className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-xs font-medium text-light-muted uppercase">Location</p>
                <p className="text-sm font-medium text-light mt-0.5">{event.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-dark-primary/60 rounded-lg border border-border">
              <CurrencyDollarIcon className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-xs font-medium text-light-muted uppercase">Price</p>
                <p className="text-lg font-bold text-light mt-0.5">${event.price}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-dark-primary/60 rounded-lg border border-border">
              <TicketIcon className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-xs font-medium text-light-muted uppercase">Availability</p>
                {isSoldOut ? (
                  <p className="text-sm font-bold text-rose-400 mt-0.5">Sold Out</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-light mt-0.5">
                      {event.availableTickets} of {event.totalTickets} tickets left
                    </p>
                    <div className="mt-2 w-full bg-dark-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          ticketPercent > 80
                            ? 'bg-rose-500'
                            : ticketPercent > 50
                            ? 'bg-amber-500'
                            : 'bg-accent'
                        }`}
                        style={{ width: `${ticketPercent}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Action */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-light-muted">
              {!user && 'Sign in to book this event'}
            </div>
            <button
              onClick={handleBook}
              disabled={isSoldOut || bookingLoading}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                isSoldOut
                  ? 'bg-dark-primary text-light-muted/50 cursor-not-allowed border border-border'
                  : 'bg-accent text-dark-primary hover:bg-accent-hover active:scale-[0.98]'
              } ${bookingLoading ? 'opacity-50 cursor-wait' : ''}`}
            >
              {bookingLoading
                ? 'Booking...'
                : isSoldOut
                ? 'Sold Out'
                : 'Book Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
