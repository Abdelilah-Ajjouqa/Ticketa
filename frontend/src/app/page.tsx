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
      <div className="relative overflow-hidden bg-dark-primary">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-light">
              Discover Amazing{' '}
              <span className="text-accent">Events</span>
            </h1>
            <p className="mt-4 text-lg text-light-muted">
              Find and book the best events happening near you. From concerts to
              workshops, we&apos;ve got you covered.
            </p>
          </div>
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-light-muted" />
              <input
                type="text"
                placeholder="Search events by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-dark-secondary text-light placeholder-light-muted/60 border border-border-strong focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-sm transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-light">
              {search ? `Results for "${search}"` : 'Upcoming Events'}
            </h2>
            <p className="text-sm text-light-muted mt-1">
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
            icon={<CalendarDaysIcon className="h-12 w-12 text-light-muted/40" />}
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
