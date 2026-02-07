import EventForm from '@/components/admin/EventForm';

export default function NewEventPage() {
    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 pb-5">
                <h3 className="text-2xl leading-6 font-medium text-gray-900">
                    Create New Event
                </h3>
            </div>
            <EventForm />
        </div>
    );
}
