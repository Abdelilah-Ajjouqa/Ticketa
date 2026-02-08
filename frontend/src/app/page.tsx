'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import EventCard from '@/components/EventCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { MagnifyingGlassIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import type { ApiEvent } from '@/lib/types';

export default function Home() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Discover Amazing Events
            </h1>
            <p className="mt-4 text-lg text-indigo-100">
              Find and book the best events happening near you. From concerts to
              workshops, we&apos;ve got you covered.
            </p>
          </div>
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search events by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {search ? `Results for "${search}"` : 'Upcoming Events'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {filtered.length} event{filtered.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No events found"
            description={
              search ? 'Try a different search term' : 'Check back later for new events'
            }
            icon={<CalendarDaysIcon className="h-12 w-12 text-slate-300" />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
