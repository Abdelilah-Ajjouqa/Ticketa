'use client';

import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { CheckCircleIcon, ExclamationIcon, XCircleIcon, ClockIcon, DownloadIcon } from '@heroicons/react/24/outline';

interface Reservation {
    _id: string;
    eventId: {
        _id: string;
        title: string;
        date: string;
    };
    status: 'PENDING' | 'CONFIRMED' | 'REFUSED' | 'CANCELLED';
    createdAt: string;
}

export default function DashboardPage() {
    const user = useAppSelector((state) => state.auth.user);
    const router = useRouter();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        fetchReservations();
    }, [user, router]);

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

    const handleCancel = async (reservationId: string) => {
        if (!confirm('Are you sure you want to cancel this reservation?')) return;
        
        setCancellingId(reservationId);
        try {
            await api.delete(`/reservations/${reservationId}`);
            setReservations(prev => prev.filter(r => r._id !== reservationId));
        } catch (error) {
            console.error('Failed to cancel reservation', error);
            alert('Failed to cancel reservation');
        } finally {
            setCancellingId(null);
        }
    };

    const handleDownloadTicket = async (reservationId: string) => {
        try {
            const res = await api.get(`/reservations/${reservationId}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ticket-${reservationId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentElement?.removeChild(link);
        } catch (error) {
            console.error('Failed to download ticket', error);
            alert('Failed to download ticket');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'PENDING':
                return <ClockIcon className="h-5 w-5 text-yellow-500" />;
            case 'REFUSED':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
            case 'CANCELLED':
                return <ExclamationIcon className="h-5 w-5 text-gray-500" />;
            default:
                return null;
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="border-b border-slate-200 pb-6 sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl leading-8 font-bold text-slate-900">
                        My Reservations
                    </h1>
                    <p className="mt-2 text-base text-slate-600">
                        View and manage your event reservations
                    </p>
                </div>
            </div>

            {reservations.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                    <p className="text-slate-500 text-lg font-medium">You haven't made any reservations yet.</p>
                    <a href="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-medium transition">
                        Browse Events
                    </a>
                </div>
            ) : (
                <div className="space-y-4">
                    {reservations.map((reservation) => (
                        <div
                            key={reservation._id}
                            className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(reservation.status)}
                                            <h4 className="text-lg font-bold text-slate-900 truncate">
                                                {reservation.eventId.title}
                                            </h4>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-600">
                                            {new Date(reservation.eventId.date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <div className="mt-3">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                                                {reservation.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 ml-2">
                                        {reservation.status === 'CONFIRMED' && (
                                            <button
                                                onClick={() => handleDownloadTicket(reservation._id)}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition whitespace-nowrap"
                                            >
                                                <DownloadIcon className="h-4 w-4 mr-2" />
                                                Download
                                            </button>
                                        )}
                                        {reservation.status !== 'CANCELLED' && reservation.status !== 'REFUSED' && (
                                            <button
                                                onClick={() => handleCancel(reservation._id)}
                                                disabled={cancellingId === reservation._id}
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                                            >
                                                {cancellingId === reservation._id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
