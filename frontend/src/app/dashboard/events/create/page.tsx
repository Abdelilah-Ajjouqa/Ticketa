'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import api, { getErrorMessage } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CreateEventPage() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    totalTickets: '',
    price: '',
  });

  if (user?.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/events', {
        ...formData,
        totalTickets: Number(formData.totalTickets),
        price: Number(formData.price),
      });
      router.push('/dashboard/events');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create event'));
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1.5 text-sm text-light-muted hover:text-light mb-6 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to events
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-light">Create Event</h1>
        <p className="text-light-muted mt-1">Fill in the details for your new event</p>
      </div>

      <div className="bg-dark-secondary rounded-xl border border-border-strong p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-light-muted mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
              placeholder="Event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-muted mb-1">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => update('description', e.target.value)}
              className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 resize-none"
              placeholder="Describe your event..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light-muted mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={formData.date}
                onChange={(e) => update('date', e.target.value)}
                className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-muted mb-1">
                Location
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => update('location', e.target.value)}
                className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                placeholder="Event location"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light-muted mb-1">
                Total Tickets
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.totalTickets}
                onChange={(e) => update('totalTickets', e.target.value)}
                className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-light-muted mb-1">
                Price ($)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => update('price', e.target.value)}
                className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                placeholder="25.00"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link
              href="/dashboard/events"
              className="px-4 py-2 text-sm font-medium text-light bg-dark-primary border border-border-strong hover:border-light/20 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-dark-primary text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
