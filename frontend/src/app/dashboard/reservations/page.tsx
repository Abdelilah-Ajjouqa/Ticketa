'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '@/lib/hooks';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import {
  TicketIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import type { ApiReservation, ApiEvent, ApiUser } from '@/lib/types';

export default function ReservationsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelModal, setCancelModal] = useState<ApiReservation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/reservations?${params.toString()}`);
      setReservations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleConfirm = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/reservations/${id}/confirm`);
      fetchReservations();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefuse = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/reservations/${id}/refuse`);
      fetchReservations();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    setActionLoading(cancelModal._id);
    try {
      await api.delete(`/reservations/${cancelModal._id}`);
      setCancelModal(null);
      fetchReservations();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async (id: string) => {
    try {
      const res = await api.get(`/reservations/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light">
            {isAdmin ? 'Reservations' : 'My Reservations'}
          </h1>
          <p className="text-light-muted mt-1">
            {isAdmin
              ? 'Manage all reservations'
              : 'View and manage your bookings'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-light-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-dark-secondary border border-border-strong rounded-lg text-sm text-light focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="refused">Refused</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {reservations.length === 0 ? (
        <EmptyState
          title="No reservations found"
          description={
            statusFilter
              ? 'Try a different filter'
              : isAdmin
              ? 'No reservations yet'
              : 'Book your first event!'
          }
          icon={<TicketIcon className="h-12 w-12 text-light-muted/30" />}
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
                  {isAdmin && (
                    <th className="text-left px-6 py-3 font-medium text-light-muted">
                      User
                    </th>
                  )}
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Ticket Code
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-light-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map((r) => {
                  const event = r.event as ApiEvent;
                  const rUser = r.user as ApiUser;
                  return (
                    <tr
                      key={r._id}
                      className="hover:bg-dark-primary/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-light">
                          {event?.title || 'Unknown Event'}
                        </p>
                        <p className="text-xs text-light-muted">
                          {event?.date
                            ? new Date(event.date).toLocaleDateString()
                            : ''}
                        </p>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-light-muted">
                          {rUser?.username || rUser?.email || 'Unknown'}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <Badge value={r.status} />
                      </td>
                      <td className="px-6 py-4 text-light-muted font-mono text-xs">
                        {r.ticketCode || '\u2014'}
                      </td>
                      <td className="px-6 py-4 text-light-muted">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {isAdmin && r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleConfirm(r._id)}
                                disabled={actionLoading === r._id}
                                className="p-2 text-light-muted bg-dark-primary/50 border border-border-strong rounded-lg hover:text-emerald-400 hover:border-emerald-500/30 transition-colors disabled:opacity-50"
                                title="Confirm"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRefuse(r._id)}
                                disabled={actionLoading === r._id}
                                className="p-2 text-light-muted bg-dark-primary/50 border border-border-strong rounded-lg hover:text-rose-400 hover:border-rose-500/30 transition-colors disabled:opacity-50"
                                title="Refuse"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {r.status === 'confirmed' && (
                            <button
                              onClick={() => handleDownloadPdf(r._id)}
                              className="p-2 text-light-muted bg-dark-primary/50 border border-border-strong rounded-lg hover:text-accent hover:border-accent/30 transition-colors"
                              title="Download Ticket"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </button>
                          )}
                          {(r.status === 'pending' || r.status === 'confirmed') && (
                            <button
                              onClick={() => setCancelModal(r)}
                              className="p-2 text-light-muted bg-dark-primary/50 border border-border-strong rounded-lg hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                              title="Cancel"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Cancel Reservation"
        actions={
          <>
            <button
              onClick={() => setCancelModal(null)}
              className="px-4 py-2 text-sm font-medium text-light bg-dark-primary border border-border-strong hover:border-light/20 rounded-lg transition-colors"
            >
              Keep Reservation
            </button>
            <button
              onClick={handleCancel}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel Reservation
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to cancel this reservation? The ticket will be
          released back to the event pool.
        </p>
      </Modal>
    </div>
  );
}
