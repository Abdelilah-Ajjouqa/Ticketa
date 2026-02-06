import Link from 'next/link';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    availableTickets: number;
    price: number;
}

export default function EventCard({ event }: { event: Event }) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 truncate">
                    {event.title}
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p className="line-clamp-3">{event.description}</p>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                    <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                    <p>
                        {new Date(event.date).toLocaleDateString()}
                    </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                    <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                    <p>
                        {event.location}
                    </p>
                </div>
                <div className="mt-4 flex justify-between items-center bg-gray-50 -m-6 p-6 border-t border-gray-100">
                    <span className="text-lg font-bold text-gray-900">${event.price}</span>
                    <Link href={`/events/${event._id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">
                        View Details →
                    </Link>
                </div>
            </div>
        </div>
    );
}
