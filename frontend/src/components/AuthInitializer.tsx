'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { setCredentials, setLoading } from '@/lib/features/auth/authSlice';
import api from '@/lib/api';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/profile', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    dispatch(setCredentials({ user: res.data, token }));
                } catch (error) {
                    console.error('Auth check failed', error);
                    localStorage.removeItem('token');
                    dispatch(setLoading(false));
                }
            } else {
                dispatch(setLoading(false));
            }
        };
        initAuth();
    }, [dispatch]);

    return <>{children}</>;
}
