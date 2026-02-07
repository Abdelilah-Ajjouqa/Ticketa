'use client';

import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logout } from '@/lib/features/auth/authSlice';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const user = useAppSelector((state) => state.auth.user);
    const dispatch = useAppDispatch();
    const router = useRouter();

    const handleLogout = () => {
        dispatch(logout());
        router.push('/login');
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-indigo-600">Ticketa</span>
                        </Link>
                        {user && (
                            <div className="hidden sm:flex space-x-1">
                                <Link href="/" className="text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
                                    Events
                                </Link>
                                {user.role === 'admin' ? (
                                    <Link href="/admin" className="text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
                                        Admin
                                    </Link>
                                ) : (
                                    <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
                                        Reservations
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <span className="text-slate-600 text-sm hidden sm:inline">
                                    <span className="font-medium">{user.username}</span>
                                    {user.role === 'admin' && (
                                        <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Admin</span>
                                    )}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex space-x-3">
                                <Link href="/login" className="text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition">
                                    Login
                                </Link>
                                <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
