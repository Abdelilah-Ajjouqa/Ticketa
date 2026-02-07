'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminEvents from '@/components/admin/AdminEvents';
import AdminReservations from '@/components/admin/AdminReservations';
import AdminStats from '@/components/admin/AdminStats';

type TabType = 'events' | 'reservations' | 'stats';

export default function AdminPage() {
    const user = useAppSelector((state) => state.auth.user);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('events');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            router.push('/login');
        }
    }, [user, router]);

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="space-y-8">
            <div className="border-b border-slate-200 pb-6">
                <h1 className="text-3xl leading-8 font-bold text-slate-900">
                    Admin Dashboard
                </h1>
                <p className="mt-2 text-base text-slate-600">
                    Manage events, reservations, and view statistics
                </p>
            </div>

            <div className="border-b border-slate-200">
                <nav className="flex space-x-1" aria-label="Tabs">
                    {[
                        { id: 'events', label: 'Events' },
                        { id: 'reservations', label: 'Reservations' },
                        { id: 'stats', label: 'Statistics' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {activeTab === 'events' && <AdminEvents />}
                {activeTab === 'reservations' && <AdminReservations />}
                {activeTab === 'stats' && <AdminStats />}
            </div>
        </div>
    );
}
