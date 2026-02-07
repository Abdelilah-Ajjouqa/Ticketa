'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface Stats {
    upcomingEventsCount: number;
    averageFillRate: number;
    reservationsByStatus: {
        PENDING: number;
        CONFIRMED: number;
        REFUSED: number;
        CANCELLED: number;
    };
}

const COLORS = ['#FBBF24', '#10B981', '#EF4444', '#9CA3AF'];

export default function AdminStats() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/events/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!stats) {
        return <div className="text-center py-12">Failed to load statistics</div>;
    }

    const pieData = [
        { name: 'Pending', value: stats.reservationsByStatus.PENDING },
        { name: 'Confirmed', value: stats.reservationsByStatus.CONFIRMED },
        { name: 'Refused', value: stats.reservationsByStatus.REFUSED },
        { name: 'Cancelled', value: stats.reservationsByStatus.CANCELLED },
    ].filter(item => item.value > 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                            Upcoming Events
                        </dt>
                        <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                            {stats.upcomingEventsCount}
                        </dd>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                            Average Fill Rate
                        </dt>
                        <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                            {Math.round(stats.averageFillRate)}%
                        </dd>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Reservations
                        </dt>
                        <dd className="mt-1 text-3xl font-extrabold text-gray-900">
                            {Object.values(stats.reservationsByStatus).reduce((a, b) => a + b, 0)}
                        </dd>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                            Confirmed Reservations
                        </dt>
                        <dd className="mt-1 text-3xl font-extrabold text-green-600">
                            {stats.reservationsByStatus.CONFIRMED}
                        </dd>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Reservations by Status</h3>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No reservation data</p>
                    )}
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Reservation Counts</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Pending', count: stats.reservationsByStatus.PENDING, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
                            { label: 'Confirmed', count: stats.reservationsByStatus.CONFIRMED, color: 'text-green-600', bgColor: 'bg-green-50' },
                            { label: 'Refused', count: stats.reservationsByStatus.REFUSED, color: 'text-red-600', bgColor: 'bg-red-50' },
                            { label: 'Cancelled', count: stats.reservationsByStatus.CANCELLED, color: 'text-gray-600', bgColor: 'bg-gray-50' },
                        ].map(item => (
                            <div key={item.label} className={`p-4 rounded ${item.bgColor}`}>
                                <div className="flex justify-between items-center">
                                    <span className={`font-medium ${item.color}`}>{item.label}</span>
                                    <span className={`text-2xl font-bold ${item.color}`}>{item.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
