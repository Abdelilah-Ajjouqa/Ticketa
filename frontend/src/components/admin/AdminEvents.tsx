'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Event {
    _id: string;
    title: string;
    date: string;
    status: 'DRAFT' | 'PUBLISHED' | 'CANCELED';
    totalTickets: number;
    availableTickets: number;
    price: number;
}

export default function AdminEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/admin');
            setEvents(res.data);
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (eventId: string) => {
        setActionId(eventId);
        try {
            await api.patch(`/events/${eventId}/publish`);
            setEvents(prev => prev.map(e => 
                e._id === eventId ? { ...e, status: 'PUBLISHED' } : e
            ));
        } catch (error) {
            console.error('Failed to publish event', error);
            alert('Failed to publish event');
        } finally {
            setActionId(null);
        }
    };

    const handleCancel = async (eventId: string) => {
        if (!confirm('Are you sure you want to cancel this event?')) return;
        
        setActionId(eventId);
        try {
            await api.patch(`/events/${eventId}/cancel`);
            setEvents(prev => prev.map(e => 
                e._id === eventId ? { ...e, status: 'CANCELED' } : e
            ));
        } catch (error) {
            console.error('Failed to cancel event', error);
            alert('Failed to cancel event');
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
        
        setActionId(eventId);
        try {
            await api.delete(`/events/${eventId}`);
            setEvents(prev => prev.filter(e => e._id !== eventId));
        } catch (error) {
            console.error('Failed to delete event', error);
            alert('Failed to delete event');
        } finally {
            setActionId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return 'bg-green-100 text-green-800';
            case 'DRAFT':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const fillRate = (event: Event) => {
        return Math.round((1 - event.availableTickets / event.totalTickets) * 100);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Link
                href="/admin/events/new"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
                Create Event
            </Link>

            {events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No events found.</p>
                </div>
            ) : (
                <div className="overflow-x-auto shadow rounded-lg">
                    <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fill Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {events.map((event) => (
                                <tr key={event._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {event.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(event.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {event.availableTickets} / {event.totalTickets}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full"
                                                    style={{ width: `${fillRate(event)}%` }}
                                                ></div>
                                            </div>
                                            <span className="ml-2 text-sm text-gray-500">{fillRate(event)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${event.price}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <Link
                                            href={`/admin/events/${event._id}/edit`}
                                            className="inline-flex items-center px-2 py-1 rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </Link>
                                        {event.status === 'DRAFT' && (
                                            <button
                                                onClick={() => handlePublish(event._id)}
                                                disabled={actionId === event._id}
                                                className="inline-flex items-center px-2 py-1 rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                                            >
                                                <CheckIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        {event.status !== 'CANCELED' && (
                                            <button
                                                onClick={() => handleCancel(event._id)}
                                                disabled={actionId === event._id}
                                                className="inline-flex items-center px-2 py-1 rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(event._id)}
                                            disabled={actionId === event._id}
                                            className="inline-flex items-center px-2 py-1 rounded text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
