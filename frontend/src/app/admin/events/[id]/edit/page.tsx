import { useParams } from 'next/navigation';
import EventForm from '@/components/admin/EventForm';

export default function EditEventPage() {
    const params = useParams();
    const eventId = params.id as string;

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 pb-5">
                <h3 className="text-2xl leading-6 font-medium text-gray-900">
                    Edit Event
                </h3>
            </div>
            <EventForm eventId={eventId} />
        </div>
    );
}
