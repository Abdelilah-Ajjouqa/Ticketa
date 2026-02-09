'use client';

import { Suspense, useState } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { setCredentials } from '@/lib/features/auth/authSlice';
import api, { getErrorMessage } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const redirect = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.accessToken;

      const profileRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      dispatch(setCredentials({ user: profileRes.data.user, token: profileRes.data.accessToken }));
      router.push(redirect || '/');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {registered && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg text-center">
          Account created successfully! Please sign in.
        </div>
      )}

      <div className="bg-dark-secondary rounded-xl border border-border-strong shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-light-muted mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-light-muted mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-dark-primary border border-border-strong rounded-lg text-sm text-light placeholder-light-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-dark-primary text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-light">Welcome back to <span className="text-accent">Ticketa</span></h1>
          <p className="text-sm text-light-muted mt-1">Sign in to your Ticketa account</p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-light-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-accent hover:text-accent-hover font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
