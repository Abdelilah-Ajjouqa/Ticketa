'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/lib/hooks';
import api from '@/lib/api';
import StatsCard from '@/components/ui/StatsCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import {
  CalendarDaysIcon,
  TicketIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { ApiReservation, ApiEvent, ApiUser, EventStats } from '@/lib/types';

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  if (user?.role === 'admin') return <AdminDashboard />;
  return <ParticipantDashboard />;
}

function AdminDashboard() {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [recentReservations, setRecentReservations] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, resRes] = await Promise.all([
          api.get('/events/stats'),
          api.get('/reservations'),
        ]);
        setStats(statsRes.data);
        setRecentReservations(resRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-light">Dashboard</h1>
        <p className="text-light-muted mt-1">Overview of your event platform</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Events"
            value={stats.events.total}
            icon={<CalendarDaysIcon className="h-6 w-6" />}
            color="indigo"
          />
          <StatsCard
            title="Upcoming Events"
            value={stats.events.upcoming}
            icon={<ChartBarIcon className="h-6 w-6" />}
            color="emerald"
          />
          <StatsCard
            title="Fill Rate"
            value={`${Math.round(stats.events.fillRate)}%`}
            icon={<TicketIcon className="h-6 w-6" />}
            trend="Tickets sold vs total"
            color="amber"
          />
          <StatsCard
            title="Total Reservations"
            value={stats.reservations.total}
            icon={<CurrencyDollarIcon className="h-6 w-6" />}
            color="violet"
          />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-dark-secondary rounded-xl border border-border-strong p-6">
            <h3 className="font-semibold text-light mb-4">Events by Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.events.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge value={status} />
                  <span className="font-medium text-light-muted">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-dark-secondary rounded-xl border border-border-strong p-6">
            <h3 className="font-semibold text-light mb-4">
              Reservations by Status
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.reservations.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge value={status} />
                  <span className="font-medium text-light-muted">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-dark-secondary rounded-xl border border-border-strong">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-semibold text-light">Recent Reservations</h3>
          <Link
            href="/dashboard/reservations"
            className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
          >
            View all <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentReservations.map((r) => {
            const event = r.event as ApiEvent;
            const rUser = r.user as ApiUser;
            return (
              <div
                key={r._id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm text-light">
                    {event?.title || 'Unknown Event'}
                  </p>
                  <p className="text-xs text-light-muted">
                    {rUser?.username || rUser?.email || 'Unknown User'}
                  </p>
                </div>
                <Badge value={r.status} />
              </div>
            );
          })}
          {recentReservations.length === 0 && (
            <p className="px-6 py-8 text-sm text-light-muted text-center">
              No reservations yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ParticipantDashboard() {
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/reservations');
        setReservations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const upcoming = reservations.filter((r) => {
    const event = r.event as ApiEvent;
    return (
      (r.status === 'pending' || r.status === 'confirmed') &&
      event?.date &&
      new Date(event.date) > new Date()
    );
  });

  const statusCounts = reservations.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-light">My Dashboard</h1>
        <p className="text-light-muted mt-1">Your reservations at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Reservations"
          value={reservations.length}
          icon={<TicketIcon className="h-6 w-6" />}
          color="indigo"
        />
        <StatsCard
          title="Confirmed"
          value={statusCounts.confirmed || 0}
          icon={<CalendarDaysIcon className="h-6 w-6" />}
          color="emerald"
        />
        <StatsCard
          title="Pending"
          value={statusCounts.pending || 0}
          icon={<ClockIcon className="h-6 w-6" />}
          color="amber"
        />
        <StatsCard
          title="Upcoming Events"
          value={upcoming.length}
          icon={<ChartBarIcon className="h-6 w-6" />}
          color="violet"
        />
      </div>

      <div className="bg-dark-secondary rounded-xl border border-border-strong">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-semibold text-light">Upcoming Events</h3>
          <Link
            href="/dashboard/reservations"
            className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
          >
            All reservations <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {upcoming.slice(0, 5).map((r) => {
            const event = r.event as ApiEvent;
            return (
              <div
                key={r._id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm text-light">
                    {event?.title || 'Unknown Event'}
                  </p>
                  <p className="text-xs text-light-muted">
                    {event?.date
                      ? new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : ''}
                  </p>
                </div>
                <Badge value={r.status} />
              </div>
            );
          })}
          {upcoming.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-light-muted">No upcoming events.</p>
              <Link
                href="/"
                className="text-sm text-accent hover:text-accent-hover mt-2 inline-block"
              >
                Browse events &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
