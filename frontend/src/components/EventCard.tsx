import Link from 'next/link';
import { CalendarIcon, MapPinIcon, TicketIcon } from '@heroicons/react/24/outline';
import type { ApiEvent } from '@/lib/types';
import Badge from '@/components/ui/Badge';

interface EventCardProps {
  event: ApiEvent;
  showStatus?: boolean;
}

export default function EventCard({ event, showStatus = false }: EventCardProps) {
  const isSoldOut = event.availableTickets <= 0;
  const ticketPercent = Math.round(
    ((event.totalTickets - event.availableTickets) / event.totalTickets) * 100
  );

  return (
    <Link href={`/events/${event._id}`} className="group block">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200">
        {/* Color bar */}
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {event.title}
            </h3>
            {showStatus && <Badge value={event.status} />}
          </div>

          <p className="mt-2 text-sm text-slate-500 line-clamp-2">
            {event.description}
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-slate-500">
              <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
              {new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className="flex items-center text-sm text-slate-500">
              <MapPinIcon className="h-4 w-4 mr-2 text-slate-400" />
              {event.location}
            </div>
            <div className="flex items-center text-sm text-slate-500">
              <TicketIcon className="h-4 w-4 mr-2 text-slate-400" />
              {isSoldOut ? (
                <span className="text-rose-600 font-medium">Sold Out</span>
              ) : (
                <span>{event.availableTickets} tickets left</span>
              )}
            </div>
          </div>

          {/* Ticket progress bar */}
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  ticketPercent > 80
                    ? 'bg-rose-500'
                    : ticketPercent > 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${ticketPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-lg font-bold text-slate-900">${event.price}</span>
            <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
              View Details &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
