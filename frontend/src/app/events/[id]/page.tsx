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
        <p className="text-slate-500">Event not found.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 text-sm font-medium"
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
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to events
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-8 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold">{event.title}</h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base">{event.description}</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Date & Time</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-slate-600">
                  {new Date(event.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <MapPinIcon className="h-5 w-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Location</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{event.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <CurrencyDollarIcon className="h-5 w-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Price</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">${event.price}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <TicketIcon className="h-5 w-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Availability</p>
                {isSoldOut ? (
                  <p className="text-sm font-bold text-rose-600 mt-0.5">Sold Out</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">
                      {event.availableTickets} of {event.totalTickets} tickets left
                    </p>
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          ticketPercent > 80
                            ? 'bg-rose-500'
                            : ticketPercent > 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
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
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Action */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-slate-500">
              {!user && 'Sign in to book this event'}
            </div>
            <button
              onClick={handleBook}
              disabled={isSoldOut || bookingLoading}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                isSoldOut
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
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
