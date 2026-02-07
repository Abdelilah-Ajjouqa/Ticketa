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
        <Link href={`/events/${event._id}`}>
            <div className="bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer h-full flex flex-col">
                <div className="px-4 py-5 sm:p-6 flex-1 flex flex-col">
                    <h3 className="text-lg leading-6 font-bold text-slate-900 truncate">
                        {event.title}
                    </h3>
                    <div className="mt-2 flex-1 text-sm text-slate-600">
                        <p className="line-clamp-3">{event.description}</p>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-slate-600">
                            <CalendarIcon className="flex-shrink-0 mr-2 h-5 w-5 text-indigo-500" aria-hidden="true" />
                            <p>
                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                            <MapPinIcon className="flex-shrink-0 mr-2 h-5 w-5 text-indigo-500" aria-hidden="true" />
                            <p className="truncate">
                                {event.location}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-lg font-bold text-indigo-600">${event.price}</span>
                        <span className="text-indigo-600 font-medium group-hover:translate-x-1 transition">
                            Details →
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
