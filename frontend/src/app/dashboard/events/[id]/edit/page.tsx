'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import api, { getErrorMessage } from '@/lib/api';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { ApiEvent } from '@/lib/types';

export default function EditEventPage() {
  const { id } = useParams();
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    totalTickets: '',
    price: '',
    status: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/admin/${id}`);
        const event: ApiEvent = res.data;
        setFormData({
          title: event.title,
          description: event.description,
          date: new Date(event.date).toISOString().slice(0, 16),
          location: event.location,
          totalTickets: String(event.totalTickets),
          price: String(event.price),
          status: event.status,
        });
      } catch {
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.patch(`/events/${id}`, {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        location: formData.location,
        totalTickets: Number(formData.totalTickets),
        price: Number(formData.price),
      });
      router.push('/dashboard/events');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update event'));
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to events
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Event</h1>
        <p className="text-slate-500 mt-1">Update the event details</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => update('description', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.date}
                onChange={(e) => update('date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => update('location', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Total Tickets
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.totalTickets}
                onChange={(e) => update('totalTickets', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => update('price', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Status
            </label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 capitalize">
              {formData.status}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Use publish/cancel actions from the events list to change status
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Link
              href="/dashboard/events"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
