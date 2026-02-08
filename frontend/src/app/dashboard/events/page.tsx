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
  const router = useRouter();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<ApiEvent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-500 mt-1">Manage your events</p>
        </div>
        <Link
          href="/dashboard/events/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Create your first event to get started"
          icon={<CalendarDaysIcon className="h-12 w-12 text-slate-300" />}
          action={
            <Link
              href="/dashboard/events/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4" />
              New Event
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-3 font-medium text-slate-500">
                    Event
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500">
                    Tickets
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500">
                    Price
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <tr
                    key={event._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{event.title}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">
                        {event.location}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge value={event.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {event.availableTickets}/{event.totalTickets}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      ${event.price}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/events/${event._id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Link>
                        {event.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(event._id)}
                            disabled={actionLoading === event._id}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Publish"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {event.status === 'published' && (
                          <button
                            onClick={() => handleCancel(event._id)}
                            disabled={actionLoading === event._id}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Cancel"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteModal(event)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>{deleteModal?.title}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
