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
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-xl leading-6 font-bold text-gray-900">
                    {event.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {event.description}
                </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" /> Date
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {new Date(event.date).toLocaleString()}
                        </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <MapPinIcon className="mr-2 h-5 w-5 text-gray-400" /> Location
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {event.location}
                        </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <TicketIcon className="mr-2 h-5 w-5 text-gray-400" /> Tickets
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {isSoldOut ? (
                                <span className="text-red-600 font-bold">Sold Out</span>
                            ) : (
                                <span>{event.availableTickets} / {event.totalTickets} available</span>
                            )}
                        </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Price</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-bold">
                            ${event.price}
                        </dd>
                    </div>
                </dl>
            </div>
            <div className="px-4 py-5 sm:px-6 border-t border-gray-200 bg-gray-50 sm:flex sm:flex-row-reverse">
                <button
                    onClick={handleBook}
                    disabled={isSoldOut || bookingLoading}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${isSoldOut
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        } ${bookingLoading ? 'opacity-75 cursor-wait' : ''}`}
                >
                    {bookingLoading ? 'Booking...' : isSoldOut ? 'Sold Out' : 'Book Ticket'}
                </button>
            </div>
            {message && (
                <div className={`p-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
}
