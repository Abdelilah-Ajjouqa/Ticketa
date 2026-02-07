'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAppSelector } from '@/lib/hooks';
import { CalendarIcon, MapPinIcon, TicketIcon } from '@heroicons/react/24/outline';

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    availableTickets: number;
    price: number;
    totalTickets: number;
}

export default function EventDetailsPage() {
    const { id } = useParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const user = useAppSelector((state) => state.auth.user);
    const router = useRouter();

    useEffect(() => {
        if (!id) return;
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${id}`);
                setEvent(res.data);
            } catch (error) {
                console.error("Failed to fetch event", error);
                setMessage({ type: 'error', text: 'Failed to load event details.' });
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const handleBook = async () => {
        if (!user) {
            router.push(`/login?redirect=/events/${id}`);
            return;
        }

        if (!event) return;

        setBookingLoading(true);
        setMessage(null);

        try {
            const res = await api.post('/reservations', { eventId: event._id });
            setMessage({ type: 'success', text: 'Reservation successful! Check your profile.' });
            setEvent({ ...event, availableTickets: event.availableTickets - 1 });
            setTimeout(() => {
                // router.push('/profile');
            }, 2000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Booking failed' });
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!event) return <div className="p-8 text-center">Event not found.</div>;

    const isSoldOut = event.availableTickets <= 0;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="px-4 py-6 sm:px-6">
                    <h1 className="text-3xl leading-8 font-bold text-slate-900">
                        {event.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-base text-slate-600 leading-relaxed">
                        {event.description}
                    </p>
                </div>
                <div className="border-t border-slate-200 px-4 py-6 sm:p-6">
                    <dl className="space-y-6 sm:space-y-0 sm:divide-y sm:divide-slate-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-slate-700 flex items-center">
                                <CalendarIcon className="mr-2 h-5 w-5 text-indigo-500" /> Date & Time
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 font-medium">
                                {new Date(event.date).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-slate-700 flex items-center">
                                <MapPinIcon className="mr-2 h-5 w-5 text-indigo-500" /> Location
                            </dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 font-medium">
                                {event.location}
                            </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-slate-700 flex items-center">
                                <TicketIcon className="mr-2 h-5 w-5 text-indigo-500" /> Tickets Available
                            </dt>
                            <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                                {isSoldOut ? (
                                    <span className="text-red-600 font-bold text-base">Sold Out</span>
                                ) : (
                                    <span className="font-medium">
                                        <span className="text-indigo-600 text-lg font-bold">{event.availableTickets}</span>
                                        <span className="text-slate-500"> of {event.totalTickets} available</span>
                                    </span>
                                )}
                            </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="text-sm font-medium text-slate-700">Price</dt>
                            <dd className="mt-1 text-3xl font-bold text-indigo-600 sm:mt-0 sm:col-span-2">
                                ${event.price.toFixed(2)}
                            </dd>
                        </div>
                    </dl>
                </div>
                <div className="px-4 py-6 sm:px-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                    <button
                        onClick={handleBook}
                        disabled={isSoldOut || bookingLoading}
                        className={`flex-1 inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-3 text-base font-medium text-white sm:text-sm transition-all ${isSoldOut
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            } ${bookingLoading ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {bookingLoading ? 'Booking...' : isSoldOut ? 'Sold Out' : 'Book Ticket'}
                    </button>
                </div>
                {message && (
                    <div className={`px-4 py-4 ${message.type === 'success' ? 'bg-green-50 border-l-4 border-green-400 text-green-700' : 'bg-red-50 border-l-4 border-red-400 text-red-700'}`}>
                        <p className="font-medium">{message.text}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
