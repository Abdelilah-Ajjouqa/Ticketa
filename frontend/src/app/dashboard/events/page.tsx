'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import type { ApiEvent } from '@/lib/types';

export default function AdminEventsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const authLoading = useAppSelector((state) => state.auth.loading);
  const router = useRouter();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<ApiEvent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events/admin');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/events/${id}/publish`);
      fetchEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/events/${id}/cancel`);
      fetchEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setActionLoading(deleteModal._id);
    try {
      await api.delete(`/events/${deleteModal._id}`);
      setDeleteModal(null);
      fetchEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-light">Events</h1>
          <p className="text-light-muted mt-1">Manage your events</p>
        </div>
        <Link
          href="/dashboard/events/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-dark-primary text-sm font-semibold rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create your first event to get started"
          icon={<CalendarDaysIcon className="h-12 w-12 text-light-muted/30" />}
          action={
            <Link
              href="/dashboard/events/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-dark-primary text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              New Event
            </Link>
          }
        />
      ) : (
        <div className="bg-dark-secondary rounded-xl border border-border-strong overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-dark-primary/50">
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Event
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Tickets
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Price
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-light-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr
                    key={event._id}
                    className="hover:bg-dark-primary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-light">{event.title}</p>
                      <p className="text-xs text-light-muted truncate max-w-xs">
                        {event.location}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-light-muted">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge value={event.status} />
                    </td>
                    <td className="px-6 py-4 text-light-muted">
                      {event.availableTickets}/{event.totalTickets}
                    </td>
                    <td className="px-6 py-4 font-medium text-light">
                      ${event.price}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/events/${event._id}/edit`}
                          className="p-2 text-light-muted bg-dark-primary/50 border border-border-strong rounded-lg hover:text-accent hover:border-accent/30 transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Link>
                        {event.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(event._id)}
                            disabled={actionLoading === event._id}
                            className="p-2 text-light-muted bg-dark-primary/50 border border-border-strong rounded-lg hover:text-emerald-400 hover:border-emerald-500/30 transition-colors disabled:opacity-50"
                            title="Publish"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {event.status === 'published' && (
                          <button
                            onClick={() => handleCancel(event._id)}
                            disabled={actionLoading === event._id}
                            className="p-2 text-light-muted bg-dark-primary/50 border border-border-strong rounded-lg hover:text-amber-400 hover:border-amber-500/30 transition-colors disabled:opacity-50"
                            title="Cancel"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteModal(event)}
                          className="p-2 text-light-muted bg-dark-primary/50 border border-border-strong rounded-lg hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Event"
        actions={
          <>
            <button
              onClick={() => setDeleteModal(null)}
              className="px-4 py-2 text-sm font-medium text-light bg-dark-primary border border-border-strong hover:border-light/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong className="text-light">{deleteModal?.title}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
