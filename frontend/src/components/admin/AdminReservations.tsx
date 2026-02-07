'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Reservation {
    _id: string;
    userId: {
        username: string;
        email: string;
    };
    eventId: {
        _id: string;
        title: string;
        date: string;
    };
    status: 'PENDING' | 'CONFIRMED' | 'REFUSED' | 'CANCELLED';
    createdAt: string;
}

interface Event {
    _id: string;
    title: string;
}

export default function AdminReservations() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterEvent, setFilterEvent] = useState('');
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => {
        fetchReservations();
        fetchEvents();
    }, []);

    const fetchReservations = async () => {
        try {
            const res = await api.get('/reservations');
            setReservations(res.data);
        } catch (error) {
            console.error('Failed to fetch reservations', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/admin');
            setEvents(res.data);
        } catch (error) {
            console.error('Failed to fetch events', error);
        }
    };

    const handleConfirm = async (reservationId: string) => {
        setActionId(reservationId);
        try {
            await api.patch(`/reservations/${reservationId}/confirm`);
            setReservations(prev => prev.map(r => 
                r._id === reservationId ? { ...r, status: 'CONFIRMED' } : r
            ));
        } catch (error) {
            console.error('Failed to confirm reservation', error);
            alert('Failed to confirm reservation');
        } finally {
            setActionId(null);
        }
    };

    const handleRefuse = async (reservationId: string) => {
        setActionId(reservationId);
        try {
            await api.patch(`/reservations/${reservationId}/refuse`);
            setReservations(prev => prev.map(r => 
                r._id === reservationId ? { ...r, status: 'REFUSED' } : r
            ));
        } catch (error) {
            console.error('Failed to refuse reservation', error);
            alert('Failed to refuse reservation');
        } finally {
            setActionId(null);
        }
    };

    const handleCancel = async (reservationId: string) => {
        if (!confirm('Are you sure you want to cancel this reservation?')) return;
        
        setActionId(reservationId);
        try {
            await api.delete(`/reservations/${reservationId}`);
            setReservations(prev => prev.filter(r => r._id !== reservationId));
        } catch (error) {
            console.error('Failed to cancel reservation', error);
            alert('Failed to cancel reservation');
        } finally {
            setActionId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'REFUSED':
                return 'bg-red-100 text-red-800';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredReservations = filterEvent
        ? reservations.filter(r => r.eventId._id === filterEvent)
        : reservations;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Event</label>
                <select
                    value={filterEvent}
                    onChange={(e) => setFilterEvent(e.target.value)}
                    className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    <option value="">All Events</option>
                    {events.map(event => (
                        <option key={event._id} value={event._id}>{event.title}</option>
                    ))}
                </select>
            </div>

            {filteredReservations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No reservations found.</p>
                </div>
            ) : (
                <div className="overflow-x-auto shadow rounded-lg">
                    <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredReservations.map((reservation) => (
                                <tr key={reservation._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{reservation.userId.username}</p>
                                            <p className="text-sm text-gray-500">{reservation.userId.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {reservation.eventId.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(reservation.eventId.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                                            {reservation.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        {reservation.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleConfirm(reservation._id)}
                                                    disabled={actionId === reservation._id}
                                                    className="inline-flex items-center px-2 py-1 rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                                                >
                                                    <CheckIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRefuse(reservation._id)}
                                                    disabled={actionId === reservation._id}
                                                    className="inline-flex items-center px-2 py-1 rounded text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                        {reservation.status !== 'CANCELLED' && (
                                            <button
                                                onClick={() => handleCancel(reservation._id)}
                                                disabled={actionId === reservation._id}
                                                className="inline-flex items-center px-2 py-1 rounded text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        )}
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
